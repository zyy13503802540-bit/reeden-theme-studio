<script setup>
import { onMounted, reactive, ref } from 'vue'
import TopBar from './components/TopBar.vue'
import LibraryPanel from './components/LibraryPanel.vue'
import PhonePreview from './components/PhonePreview.vue'
import DetailPanel from './components/DetailPanel.vue'
import SettingsModal from './components/SettingsModal.vue'
import ProgressOverlay from './components/ProgressOverlay.vue'
import { state, importFiles, clearAll, restoreFromStorage, refreshSyncBadge, removeTheme, retrySync, listRemoteThemes, toggleRemoteSelected, restoreFromGithub, deleteRemoteTheme } from './lib/store.js'

const mobileTab = ref('library')

function onImport(files) {
  mobileTab.value = 'preview'
  importFiles(files)
}

// 应用内确认弹窗（原生 confirm 在内嵌 webview 中会挂起/崩溃渲染进程）
const confirmBox = reactive({ open: false, message: '', okText: '确定', resolve: null })
function askConfirm(message, okText = '确定') {
  confirmBox.message = message
  confirmBox.okText = okText
  confirmBox.open = true
  return new Promise(resolve => {
    confirmBox.resolve = resolve
  })
}
function answerConfirm(ok) {
  confirmBox.open = false
  const resolve = confirmBox.resolve
  confirmBox.resolve = null
  if (resolve) resolve(ok)
}

async function onClear() {
  if (!state.themes.length && !state.failures.length) return
  const ok = await askConfirm('确定清空全部已导入主题？本地保存的记录也会一并删除（GitHub 仓库中的文件不受影响）。', '确定清空')
  if (ok) await clearAll()
}

async function onRemoveTheme(theme) {
  const ok = await askConfirm(`确定删除「${theme.title}」？本地保存的记录也会一并删除。`, '删除')
  if (ok) await removeTheme(theme.uid)
}

const syncRetrying = ref(false)
async function onRetrySync() {
  if (!state.syncError || syncRetrying.value) return
  syncRetrying.value = true
  try {
    await retrySync(state.syncError.fileName)
    state.syncErrorOpen = false
  } catch {
    // 失败原因已写入 state.syncError，弹窗保持打开并展示新报错
  } finally {
    syncRetrying.value = false
  }
}

// 仓库主题列表弹窗
function selectAllRemote() {
  for (const t of state.remoteThemes) {
    if (!t.exists) state.remoteSelected.add(t.name)
  }
}
function invertRemote() {
  for (const t of state.remoteThemes) {
    if (t.exists) continue
    if (state.remoteSelected.has(t.name)) state.remoteSelected.delete(t.name)
    else state.remoteSelected.add(t.name)
  }
}
async function onRestoreSelected() {
  const names = [...state.remoteSelected]
  if (!names.length) return
  await restoreFromGithub(names)
}
const remoteDeleting = ref('')
async function onDeleteRemote(theme) {
  const ok = await askConfirm(
    `确定从 GitHub 仓库删除「${theme.name}」？\n这会永久移除该主题的整文件和所有分片，本地已导入的副本不受影响。`,
    '从仓库删除'
  )
  if (!ok) return
  remoteDeleting.value = theme.name
  try {
    await deleteRemoteTheme(theme.name)
  } catch (err) {
    state.remoteListError = err.message || '删除失败'
  } finally {
    remoteDeleting.value = ''
  }
}
function formatSize(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

onMounted(async () => {
  refreshSyncBadge()
  await restoreFromStorage()
})
</script>

<template>
  <TopBar @import="onImport" @open-settings="state.settingsOpen = true" @clear-all="onClear" />

  <main class="workspace" :data-mobile="mobileTab">
    <LibraryPanel @select="mobileTab = 'preview'" @remove="onRemoveTheme" />
    <PhonePreview />
    <DetailPanel />
  </main>

  <nav class="mobile-tabs">
    <button :class="{ active: mobileTab === 'library' }" @click="mobileTab = 'library'">主题库</button>
    <button :class="{ active: mobileTab === 'preview' }" @click="mobileTab = 'preview'">预览</button>
    <button :class="{ active: mobileTab === 'detail' }" @click="mobileTab = 'detail'">详情</button>
  </nav>

  <SettingsModal />
  <ProgressOverlay />

  <!-- 同步失败详情弹窗 -->
  <div v-if="state.syncErrorOpen && state.syncError" class="overlay" @click.self="state.syncErrorOpen = false">
    <div class="dialog">
      <h2>GitHub 同步失败</h2>
      <p class="dialog-sub">
        文件「{{ state.syncError.fileName }}」上传到仓库时出错，完整报错如下：
      </p>
      <pre class="sync-error-detail">{{ state.syncError.message }}</pre>
      <div class="sync-error-tips">
        常见原因：Token 过期或未勾选 repo 权限；仓库所有者/仓库名填错；网络无法访问
        api.github.com（可开代理再试）。大于 30MB 的主题会自动切成 8MB 分片上传，全程只经过
        api.github.com，理论上不再有大小限制。
      </div>
      <div class="dialog-actions">
        <button class="btn" @click="state.syncErrorOpen = false">关闭</button>
        <button class="btn btn-primary" :disabled="syncRetrying" @click="onRetrySync">
          {{ syncRetrying ? '重试中…' : '重试同步' }}
        </button>
      </div>
    </div>
  </div>

  <!-- 仓库主题列表弹窗：选择恢复 / 从仓库删除 -->
  <div v-if="state.remoteListOpen" class="overlay" @click.self="state.remoteListOpen = false">
    <div class="dialog remote-dialog">
      <h2>GitHub 仓库主题</h2>
      <p class="dialog-sub">
        列出仓库中所有 .red 文件。勾选后可恢复到本地；也可以直接从仓库删除（不影响本地已导入的副本）。
      </p>

      <div v-if="state.remoteListLoading" class="remote-loading">
        <span class="dot spin" /> 正在拉取仓库文件…
      </div>
      <div v-else-if="state.remoteListError" class="remote-error">
        {{ state.remoteListError }}
      </div>
      <div v-else-if="!state.remoteThemes.length" class="remote-empty">
        仓库中没有 .red 文件
      </div>

      <div v-else class="remote-list">
        <div
          v-for="t in state.remoteThemes"
          :key="t.name"
          class="remote-row"
          :class="{ disabled: t.exists }"
        >
          <input
            type="checkbox"
            :checked="state.remoteSelected.has(t.name)"
            :disabled="t.exists"
            @change="toggleRemoteSelected(t.name)"
          />
          <span class="remote-name">{{ t.name }}</span>
          <span class="remote-meta">
            <span>{{ formatSize(t.size) }}</span>
            <span v-if="t.parts" class="part-badge">{{ t.parts.length }} 分片</span>
            <span v-if="t.exists" class="exists-badge">本地已存在</span>
          </span>
          <button
            class="btn btn-danger btn-sm"
            :disabled="remoteDeleting === t.name"
            @click="onDeleteRemote(t)"
          >{{ remoteDeleting === t.name ? '删除中…' : '从仓库删除' }}</button>
        </div>
      </div>

      <div class="dialog-actions" style="justify-content:space-between">
        <div v-if="!state.remoteListLoading && state.remoteThemes.length" class="remote-selectors">
          <button class="btn btn-sm" @click="selectAllRemote">全选未恢复</button>
          <button class="btn btn-sm" @click="invertRemote">反选</button>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn" @click="state.remoteListOpen = false">关闭</button>
          <button
            class="btn btn-primary"
            :disabled="!state.remoteSelected.size"
            @click="onRestoreSelected"
          >恢复选中（{{ state.remoteSelected.size }}）</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 通用确认弹窗 -->
  <div v-if="confirmBox.open" class="overlay" @click.self="answerConfirm(false)">
    <div class="dialog dialog-confirm">
      <h2>确认操作</h2>
      <p class="dialog-sub">{{ confirmBox.message }}</p>
      <div class="dialog-actions">
        <button class="btn" @click="answerConfirm(false)">取消</button>
        <button class="btn btn-danger" @click="answerConfirm(true)">{{ confirmBox.okText }}</button>
      </div>
    </div>
  </div>
</template>
