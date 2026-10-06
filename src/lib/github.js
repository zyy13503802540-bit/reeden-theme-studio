// GitHub 同步：纯浏览器直连，无需后端，全程只访问 api.github.com
// 小文件：Contents API 一次 PUT（上限 1MB）
// 中文件：Git Data API（blob → tree → commit → ref）
// 大文件：切片成 8MB 分片走 Git Data API（blob 接口请求体有限制，分片后不受限；
//         不使用 Release 附件，因为 uploads.github.com 在部分网络下不可达）
import { bytesToBinary } from './red/binary.js'

const CONTENTS_LIMIT = 900 * 1024 // 留余量，低于 Contents API 1MB 上限
const BLOB_LIMIT = 30 * 1024 * 1024 // 超过直接跳过整文件 blob，走切片
const CHUNK_SIZE = 8 * 1024 * 1024 // 分片大小：base64 后约 11MB，远低于 blob 请求体限制
const PART_RE = /^(.*\.red)\.part-(\d{4})$/i // 分片命名：xxx.red.part-0001

function joinPath(base, fileName) {
  const dir = base.replace(/^\/+|\/+$/g, '')
  return dir ? `${dir}/${encodeURIComponent(fileName)}` : encodeURIComponent(fileName)
}

/** Git Tree 用的原始路径（不做 URL 编码，否则中文名会带 % 落盘） */
function joinRawPath(base, fileName) {
  const dir = base.replace(/^\/+|\/+$/g, '')
  return dir ? `${dir}/${fileName}` : fileName
}

async function fetchSha(api, token) {
  const res = await fetch(api, {
    headers: { authorization: `token ${token}`, accept: 'application/vnd.github+json' }
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`查询文件失败：HTTP ${res.status}`)
  const data = await res.json()
  return data.sha
}

/** 统一请求封装：自动拼 token 头、抛带状态码的错误、兼容 204 空响应 */
async function gh(config, api, options = {}) {
  const res = await fetch(`https://api.github.com${api}`, {
    ...options,
    headers: {
      authorization: `token ${config.token}`,
      accept: 'application/vnd.github+json',
      ...(options.body ? { 'content-type': 'application/json' } : {})
    }
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    const err = new Error(`GitHub HTTP ${res.status}：${detail.slice(0, 180)}`)
    err.status = res.status
    throw err
  }
  if (res.status === 204) return null
  return res.json()
}

/**
 * 上传/更新一个文件（按大小自动选择通道）
 * @returns {Promise<{updated:boolean, url:string}>}
 */
export async function uploadToGithub(fileName, bytes, config) {
  const { token, owner, repo, path } = config
  if (!token || !owner || !repo) throw new Error('GitHub 尚未配置完整')

  if (bytes.length < CONTENTS_LIMIT) {
    return uploadViaContents(config, path || 'themes/', fileName, btoa(bytesToBinary(bytes)))
  }
  if (bytes.length < BLOB_LIMIT) {
    try {
      return await uploadViaGitData(config, path || 'themes/', fileName, btoa(bytesToBinary(bytes)))
    } catch (err) {
      // blob 接口对超大请求体会 422（"input was too large"），降级到切片上传
      if (!/too large/i.test(err.message)) throw err
    }
  }
  return uploadViaChunks(config, path || 'themes/', fileName, bytes)
}

/** 小文件：Contents API 一次 PUT 搞定 */
async function uploadViaContents(config, dir, fileName, content) {
  const { owner, repo, token } = config
  const api = `https://api.github.com/repos/${owner}/${repo}/contents/${joinPath(dir, fileName)}`
  const sha = await fetchSha(api, token)

  const body = {
    message: `${sha ? 'Update' : 'Add'} ${fileName} via Reeden Theme Studio`,
    content,
    branch: 'main'
  }
  if (sha) body.sha = sha

  const res = await fetch(api, {
    method: 'PUT',
    headers: {
      authorization: `token ${token}`,
      accept: 'application/vnd.github+json',
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`GitHub HTTP ${res.status}：${detail.slice(0, 180)}`)
  }
  const data = await res.json()
  return { updated: !!sha, url: data.content?.html_url || '' }
}

/** 取 main 分支 HEAD 位置（空仓库没有分支，返回 null） */
async function getHead(config) {
  const base = `/repos/${config.owner}/${config.repo}`
  try {
    const ref = await gh(config, `${base}/git/ref/heads/main`)
    const headCommit = await gh(config, `${base}/git/commits/${ref.object.sha}`)
    return { headSha: ref.object.sha, baseTree: headCommit.tree.sha }
  } catch (err) {
    if (err.status === 404 || err.status === 409) return null
    throw err
  }
}

/** 把一组 tree 条目提交到 main 分支（条目 sha 为 null 表示删除该路径） */
async function commitTreeEntries(config, entries, message) {
  const base = `/repos/${config.owner}/${config.repo}`
  const head = await getHead(config)

  const treeBody = { tree: entries }
  if (head) treeBody.base_tree = head.baseTree
  const tree = await gh(config, `${base}/git/trees`, { method: 'POST', body: JSON.stringify(treeBody) })

  const commitBody = { message, tree: tree.sha }
  if (head) commitBody.parents = [head.headSha]
  const commit = await gh(config, `${base}/git/commits`, { method: 'POST', body: JSON.stringify(commitBody) })

  if (head) {
    await gh(config, `${base}/git/refs/heads/main`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) })
  } else {
    await gh(config, `${base}/git/refs`, { method: 'POST', body: JSON.stringify({ ref: 'refs/heads/main', sha: commit.sha }) })
  }
  return { updated: !!head }
}

/** 中文件：单个 blob 落盘 */
async function uploadViaGitData(config, dir, fileName, content) {
  const base = `/repos/${config.owner}/${config.repo}`
  const blob = await gh(config, `${base}/git/blobs`, {
    method: 'POST',
    body: JSON.stringify({ content, encoding: 'base64' })
  })
  const filePath = joinRawPath(dir, fileName)
  return commitTreeEntries(
    config,
    [{ path: filePath, mode: '100644', type: 'blob', sha: blob.sha }],
    `Add/Update ${fileName} via Reeden Theme Studio`
  )
}

/** 大文件：切片成多个 blob，一个 commit 写入；同时清理旧分片和同名整文件 */
async function uploadViaChunks(config, dir, fileName, bytes) {
  const base = `/repos/${config.owner}/${config.repo}`

  // 1. 逐片创建 blob（8MB 一片，请求体约 11MB，稳定通过）
  const count = Math.ceil(bytes.length / CHUNK_SIZE)
  const partNames = []
  const entries = []
  for (let i = 0; i < count; i++) {
    const chunk = bytes.subarray(i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE, bytes.length))
    const blob = await gh(config, `${base}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: btoa(bytesToBinary(chunk)), encoding: 'base64' })
    })
    const partName = `${fileName}.part-${String(i + 1).padStart(4, '0')}`
    partNames.push(partName)
    entries.push({ path: joinRawPath(dir, partName), mode: '100644', type: 'blob', sha: blob.sha })
  }

  // 2. 列目录，清理：该主题的旧分片（数量变化会留垃圾）和同名整文件（曾经小于 1MB 时传过）
  const res = await fetch(`${`https://api.github.com`}${base}/contents/${dir.replace(/^\/+|\/+$/g, '')}`, {
    headers: { authorization: `token ${config.token}`, accept: 'application/vnd.github+json' }
  })
  if (res.ok) {
    const items = await res.json()
    if (Array.isArray(items)) {
      const keep = new Set(partNames)
      for (const it of items) {
        const isWhole = it.name === fileName
        const isStalePart = PART_RE.test(it.name) && it.name.match(PART_RE)[1] === fileName
        if (it.type === 'file' && (isWhole || isStalePart) && !keep.has(it.name)) {
          entries.push({ path: joinRawPath(dir, it.name), mode: '100644', type: 'blob', sha: null })
        }
      }
    }
  }

  // 3. 一个 commit 完成写入 + 清理
  return commitTreeEntries(config, entries, `Add/Update ${fileName} (${count} parts) via Reeden Theme Studio`)
}

/** 列出仓库目录中的 .red 文件；分片按序号聚合为一个逻辑文件（与整文件同名时以分片为准，更新） */
export async function listGithubFiles(config) {
  const { token, owner, repo, path } = config
  if (!token || !owner || !repo) throw new Error('GitHub 尚未配置完整')

  const api = `https://api.github.com/repos/${owner}/${repo}/contents/${(path || 'themes/').replace(/^\/+|\/+$/g, '')}`
  const res = await fetch(api, {
    headers: { authorization: `token ${token}`, accept: 'application/vnd.github+json' }
  })
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`列出仓库文件失败：HTTP ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data)) return []

  const whole = []
  const partGroups = new Map() // baseName -> [{name, sha, size, order}]
  for (const item of data) {
    if (item.type !== 'file') continue
    const m = item.name.match(PART_RE)
    if (m) {
      if (!partGroups.has(m[1])) partGroups.set(m[1], [])
      partGroups.get(m[1]).push({ name: item.name, sha: item.sha, size: item.size, order: parseInt(m[2], 10) })
    } else if (/\.red$/i.test(item.name)) {
      whole.push({ name: item.name, size: item.size, sha: item.sha })
    }
  }

  // 分片组聚合：按序号排序、大小求和（等于原文件大小）
  const grouped = [...partGroups.entries()].map(([name, parts]) => {
    parts.sort((a, b) => a.order - b.order)
    return { name, size: parts.reduce((sum, p) => sum + p.size, 0), parts }
  })
  const groupedNames = new Set(grouped.map(g => g.name))
  return whole.filter(f => !groupedNames.has(f.name)).concat(grouped)
}

/** 按 sha 从 Git Data Blob API 取回文件字节 */
export async function fetchGithubBlob(config, sha) {
  const { token, owner, repo } = config
  const api = `https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`
  const res = await fetch(api, {
    headers: { authorization: `token ${token}`, accept: 'application/vnd.github+json' }
  })
  if (!res.ok) throw new Error(`下载文件失败：HTTP ${res.status}`)
  const data = await res.json()
  const bin = atob(String(data.content || '').replace(/\s+/g, ''))
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** 按序下载全部分片并拼接为原始字节 */
export async function fetchGithubParts(config, parts) {
  const chunks = []
  let total = 0
  for (const part of parts) {
    const chunk = await fetchGithubBlob(config, part.sha)
    chunks.push(chunk)
    total += chunk.length
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

/** 从仓库删除某个主题：整文件 + 全部分片（一个 commit 完成） */
export async function deleteFromGithub(config, dir, fileName) {
  const base = `/repos/${config.owner}/${config.repo}`
  const api = `https://api.github.com${base}/contents/${(dir || 'themes/').replace(/^\/+|\/+$/g, '')}`
  const res = await fetch(api, {
    headers: { authorization: `token ${config.token}`, accept: 'application/vnd.github+json' }
  })
  if (res.status === 404) return { deleted: 0 }
  if (!res.ok) throw new Error(`列出仓库文件失败：HTTP ${res.status}`)
  const items = await res.json()

  const entries = []
  if (Array.isArray(items)) {
    for (const it of items) {
      if (it.type !== 'file') continue
      const isWhole = it.name === fileName
      const m = it.name.match(PART_RE)
      const isPart = m && m[1] === fileName
      if (isWhole || isPart) {
        entries.push({ path: joinRawPath(dir, it.name), mode: '100644', type: 'blob', sha: null })
      }
    }
  }
  if (!entries.length) return { deleted: 0 }
  await commitTreeEntries(config, entries, `Delete ${fileName} via Reeden Theme Studio`)
  return { deleted: entries.length }
}
