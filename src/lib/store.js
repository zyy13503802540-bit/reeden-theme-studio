// 全局应用状态（Vue reactive，无额外状态库）
import { reactive, computed } from 'vue'
import { parseRedFile } from './red/index.js'
import { saveFile, getAllFiles, clearFiles, deleteFile, getFile } from './storage.js'
import { uploadToGithub, listGithubFiles, fetchGithubBlob, fetchGithubParts, deleteFromGithub } from './github.js'

const FAV_KEY = 'rts.favorites'
const GH_KEY = 'rts.github'

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

let uidSeq = 0
function withUid(theme) {
  theme.uid = `t${++uidSeq}_${Date.now().toString(36)}`
  return theme
}

export const state = reactive({
  themes: [],
  activeUid: null,
  failures: [],
  query: '',
  filter: 'all', // all | favorite | resource | error
  page: 'shelf', // shelf | reader
  mode: 'light', // light | dark
  favorites: new Set(loadJson(FAV_KEY, [])),
  github: loadJson(GH_KEY, { token: '', owner: '', repo: '', path: 'themes/' }),
  sync: { kind: 'unset', text: '未配置' },
  syncError: null, // 最近一条同步失败的完整记录（角标点击查看）
  syncErrorOpen: false,
  remoteThemes: [], // GitHub 仓库中的主题列表（带本地状态标记）
  remoteListOpen: false,
  remoteListLoading: false,
  remoteListError: null,
  remoteSelected: new Set(), // 仓库列表中勾选的文件名
  progress: null,
  settingsOpen: false,
  restoring: false,

  activeTheme: computed(() => state.themes.find(t => t.uid === state.activeUid) || null),
  visibleThemes: computed(() => {
    const q = state.query.trim().toLowerCase()
    return state.themes.filter(t => {
      if (t.isResourceOnly) return false
      const words = `${t.title} ${t.fileName} ${t.app?.author || t.app?.creator || ''}`.toLowerCase()
      if (q && !words.includes(q)) return false
      if (state.filter === 'favorite' && !state.favorites.has(`${t.fileName}:${t.size}`)) return false
      return true
    })
  }),
  resourceThemes: computed(() => state.themes.filter(t => t.isResourceOnly))
})

export function favoriteId(theme) {
  return `${theme.fileName}:${theme.size}`
}

export function toggleFavorite(theme) {
  const key = favoriteId(theme)
  if (state.favorites.has(key)) state.favorites.delete(key)
  else state.favorites.add(key)
  localStorage.setItem(FAV_KEY, JSON.stringify([...state.favorites]))
}

function setSync(kind, text) {
  state.sync = { kind, text }
}

/** 记录一条完整的同步失败信息，供角标点击弹窗查看 */
function recordSyncError(fileName, err) {
  state.syncError = {
    fileName,
    message: err.message || '未知错误',
    stack: err.stack || '',
    time: Date.now()
  }
  setSync('error', '同步失败（点击查看原因）')
}

export function refreshSyncBadge() {
  const ok = !!(state.github.token && state.github.owner && state.github.repo)
  setSync(ok ? 'ok' : 'unset', ok ? '已配置' : '未配置')
}

export function saveGithubConfig(cfg) {
  state.github = { path: 'themes/', ...cfg }
  localStorage.setItem(GH_KEY, JSON.stringify(state.github))
  refreshSyncBadge()
}

function syncConfigured() {
  const { token, owner, repo } = state.github
  return !!(token && owner && repo)
}

/** 导入一批 .red 文件：解析 → 入内存 → 存 IndexedDB → 推 GitHub */
export async function importFiles(fileList) {
  const files = [...fileList].filter(f => /\.red$/i.test(f.name))
  if (!files.length) {
    state.failures.push({ fileName: '(未选择文件)', error: '请选择 .red 文件' })
    state.filter = 'error'
    return
  }

  const job = reactive({
    total: files.length,
    done: 0,
    ok: 0,
    failed: 0,
    current: '准备解析…',
    failures: [],
    cancelled: false,
    finished: false
  })
  state.progress = job

  for (const file of files) {
    if (job.cancelled) break
    job.current = `正在解析：${file.name}`
    try {
      const theme = withUid(await parseRedFile(file, { shouldCancel: () => job.cancelled }))
      if (job.cancelled) break

      // 同名同大小视为同一主题：先移除旧内存项
      const existing = state.themes.findIndex(t => t.fileName === theme.fileName && t.size === theme.size)
      if (existing >= 0) {
        state.themes.splice(existing, 1, theme)
      } else {
        state.themes.push(theme)
      }
      if (!theme.isResourceOnly) {
        state.activeUid = theme.uid
        state.filter = 'all'
      }

      const bytes = new Uint8Array(await file.arrayBuffer())
      await saveFile({
        id: `${file.name}:${file.size}`,
        fileName: file.name,
        size: file.size,
        bytes,
        isResourceOnly: theme.isResourceOnly,
        resourceKind: theme.resourceKind,
        title: theme.title,
        savedAt: Date.now()
      })

      if (syncConfigured()) {
        job.current = `正在同步到 GitHub：${file.name}`
        setSync('syncing', '同步中…')
        try {
          const res = await uploadToGithub(file.name, bytes, state.github)
          setSync('ok', res.updated ? '已更新' : '已同步')
        } catch (err) {
          recordSyncError(file.name, err)
        }
      }
      job.ok++
    } catch (err) {
      if (err.cancelled || job.cancelled) {
        job.cancelled = true
        break
      }
      const failure = { fileName: file.name, error: err.message || '未知错误' }
      job.failures.push(failure)
      state.failures.push(failure)
      job.failed++
    }
    job.done++
  }

  if (!state.activeUid && state.themes.length) {
    state.activeUid = state.themes[state.themes.length - 1].uid
  }
  job.current = job.cancelled ? '已取消' : '解析完成'
  job.finished = true
}

export function dismissProgress() {
  state.progress = null
}

export async function clearAll() {
  state.themes.splice(0, state.themes.length)
  state.failures.splice(0, state.failures.length)
  state.activeUid = null
  await clearFiles()
  state.filter = 'all'
}

/** 导出单个主题：从 IndexedDB 取回原始字节，触发浏览器下载 .red 文件 */
export async function exportTheme(uid) {
  const theme = state.themes.find(t => t.uid === uid)
  if (!theme) return
  const record = await getFile(`${theme.fileName}:${theme.size}`)
  if (!record || !record.bytes) return
  const blob = new Blob([record.bytes], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = theme.fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

/** 删除单个主题：内存 + IndexedDB 记录一并移除，并修正当前选中项 */
export async function removeTheme(uid) {
  const index = state.themes.findIndex(t => t.uid === uid)
  if (index < 0) return
  const theme = state.themes[index]
  // 释放 blob URL，避免内存泄漏
  for (const asset of theme.assets || []) {
    if (asset.url && asset.url.startsWith('blob:')) {
      try { URL.revokeObjectURL(asset.url) } catch { }
    }
  }
  state.themes.splice(index, 1)
  await deleteFile(`${theme.fileName}:${theme.size}`)
  if (state.activeUid === uid) {
    const next = state.themes[index] || state.themes[index - 1] || state.themes[0]
    state.activeUid = next ? next.uid : null
  }
}

/** 启动时从 IndexedDB 读取字节并重新解析，完整还原预览 */
export async function restoreFromStorage() {
  const records = await getAllFiles()
  if (!records.length) return
  state.restoring = true
  records.sort((a, b) => (a.savedAt || 0) - (b.savedAt || 0))
  for (const record of records) {
    try {
      const file = new File([record.bytes], record.fileName)
      const theme = withUid(await parseRedFile(file))
      state.themes.push(theme)
      if (!theme.isResourceOnly && !state.activeUid) state.activeUid = theme.uid
    } catch (err) {
      state.failures.push({ fileName: record.fileName, error: `恢复失败：${err.message}` })
    }
  }
  if (!state.activeUid && state.themes.length) state.activeUid = state.themes[0].uid
  state.restoring = false
}

export function selectTheme(uid) {
  state.activeUid = uid
}

/** 重试同步：把某个本地主题重新上传到 GitHub（可从错误弹窗触发） */
export async function retrySync(fileName) {
  if (!syncConfigured()) throw new Error('GitHub 尚未配置完整')
  const theme = state.themes.find(t => t.fileName === fileName)
  if (!theme) throw new Error('本地未找到该主题')

  setSync('syncing', '同步中…')
  try {
    const record = await getFile(`${fileName}:${theme.size}`)
    if (!record || !record.bytes) throw new Error('IndexedDB 中未找到原始文件')
    const res = await uploadToGithub(fileName, record.bytes, state.github)
    setSync('ok', res.updated ? '已更新' : '已同步')
    state.syncError = null
    return res
  } catch (err) {
    recordSyncError(fileName, err)
    throw err
  }
}

/** 拉取 GitHub 仓库主题列表并打开选择弹窗 */
export async function listRemoteThemes() {
  if (!syncConfigured()) {
    state.remoteListError = '请先在设置中配置 GitHub 同步'
    state.remoteThemes = []
    state.remoteListOpen = true
    return
  }
  state.remoteListLoading = true
  state.remoteListError = null
  state.remoteListOpen = true
  try {
    const remote = await listGithubFiles(state.github)
    const localKeys = new Set(state.themes.map(t => `${t.fileName}:${t.size}`))
    state.remoteThemes = remote.map(f => ({
      ...f,
      exists: localKeys.has(`${f.name}:${f.size}`)
    }))
    state.remoteSelected = new Set()
  } catch (err) {
    state.remoteListError = err.message || '拉取仓库列表失败'
    state.remoteThemes = []
  } finally {
    state.remoteListLoading = false
  }
}

/** 切换仓库列表中某个主题的勾选状态 */
export function toggleRemoteSelected(name) {
  if (state.remoteSelected.has(name)) state.remoteSelected.delete(name)
  else state.remoteSelected.add(name)
}

/** 从 GitHub 仓库拉取选中的主题：下载 → 解析 → 入库 */
export async function restoreFromGithub(selectedNames) {
  if (!syncConfigured()) {
    state.failures.push({ fileName: '(GitHub)', error: '请先在设置中配置 GitHub 同步' })
    state.filter = 'error'
    return
  }
  if (state.progress && !state.progress.finished) return

  const job = reactive({
    total: 0,
    done: 0,
    ok: 0,
    failed: 0,
    current: '正在列出仓库文件…',
    failures: [],
    cancelled: false,
    finished: false
  })
  state.progress = job

  // 优先复用已拉取的列表，否则重新拉取
  let remote = state.remoteThemes.length ? state.remoteThemes : []
  if (!remote.length) {
    try {
      remote = await listGithubFiles(state.github)
    } catch (err) {
      job.failures.push({ fileName: '(GitHub)', error: err.message })
      state.failures.push({ fileName: '(GitHub)', error: err.message })
      job.failed++
      job.finished = true
      job.current = '列出文件失败'
      return
    }
  }

  // 与本地对比：fileName:size 一致视为已存在，跳过
  const localKeys = new Set(state.themes.map(t => `${t.fileName}:${t.size}`))
  let missing = remote.filter(f => !localKeys.has(`${f.name}:${f.size}`))

  // 如果指定了要恢复的文件名，只恢复选中的
  if (Array.isArray(selectedNames) && selectedNames.length) {
    const wanted = new Set(selectedNames)
    missing = missing.filter(f => wanted.has(f.name))
  }

  job.total = missing.length
  if (!missing.length) {
    job.current = remote.length ? '所选主题均已存在，无需恢复' : '仓库目录中没有 .red 文件'
    job.finished = true
    return
  }

  state.remoteListOpen = false

  for (const item of missing) {
    if (job.cancelled) break
    job.current = `正在下载：${item.name}`
    try {
      const bytes = item.parts
        ? await fetchGithubParts(state.github, item.parts)
        : await fetchGithubBlob(state.github, item.sha)
      if (job.cancelled) break

      job.current = `正在解析：${item.name}`
      const file = new File([bytes], item.name)
      const theme = withUid(await parseRedFile(file))
      if (job.cancelled) break

      const existing = state.themes.findIndex(t => t.fileName === theme.fileName && t.size === theme.size)
      if (existing >= 0) state.themes.splice(existing, 1, theme)
      else state.themes.push(theme)
      if (!theme.isResourceOnly && !state.activeUid) {
        state.activeUid = theme.uid
        state.filter = 'all'
      }

      await saveFile({
        id: `${item.name}:${bytes.length}`,
        fileName: item.name,
        size: bytes.length,
        bytes,
        isResourceOnly: theme.isResourceOnly,
        resourceKind: theme.resourceKind,
        title: theme.title,
        savedAt: Date.now()
      })
      job.ok++
    } catch (err) {
      if (err.cancelled || job.cancelled) {
        job.cancelled = true
        break
      }
      const failure = { fileName: item.name, error: err.message || '未知错误' }
      job.failures.push(failure)
      state.failures.push(failure)
      job.failed++
    }
    job.done++
  }

  if (!state.activeUid && state.themes.length) {
    state.activeUid = state.themes[state.themes.length - 1].uid
  }
  job.current = job.cancelled ? '已取消' : '恢复完成'
  job.finished = true
}

/** 从 GitHub 仓库删除某个主题（整文件 + 全部分片），然后刷新列表 */
export async function deleteRemoteTheme(fileName) {
  if (!syncConfigured()) throw new Error('GitHub 尚未配置完整')
  const result = await deleteFromGithub(state.github, state.github.path || 'themes/', fileName)
  // 从本地列表移除
  state.remoteThemes = state.remoteThemes.filter(t => t.name !== fileName)
  state.remoteSelected.delete(fileName)
  return result
}

export function shiftActive(delta) {
  const list = state.visibleThemes
  if (!list.length) return
  const index = list.findIndex(t => t.uid === state.activeUid)
  const next = Math.max(0, Math.min(list.length - 1, (index < 0 ? 0 : index) + delta))
  state.activeUid = list[next].uid
}
