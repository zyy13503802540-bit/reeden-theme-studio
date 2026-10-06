<script setup>
import { reactive, ref, watch } from 'vue'
import { state, saveGithubConfig, listRemoteThemes } from '../lib/store.js'

const form = reactive({ token: '', owner: '', repo: '', path: 'themes/' })
const tutorialOpen = ref(false)

watch(
  () => state.settingsOpen,
  open => {
    if (open) Object.assign(form, state.github)
  }
)

function save() {
  saveGithubConfig({
    token: form.token.trim(),
    owner: form.owner.trim(),
    repo: form.repo.trim(),
    path: form.path.trim() || 'themes/'
  })
  state.settingsOpen = false
}

function restore() {
  save()
  listRemoteThemes()
}
</script>

<template>
  <div v-if="state.settingsOpen" class="overlay" @click.self="state.settingsOpen = false">
    <div class="dialog">
      <h2>GitHub 同步设置</h2>
      <p class="dialog-sub">
        配置完成后，每次导入的 .red 文件都会自动提交到指定仓库的目录中。
        Token 仅保存在本浏览器的 localStorage。
      </p>

      <button class="tutorial-toggle" @click="tutorialOpen = !tutorialOpen">
        <span>📖 配置教程</span>
        <span class="arrow" :class="{ open: tutorialOpen }">▾</span>
      </button>
      <div v-if="tutorialOpen" class="tutorial">
        <ol>
          <li>
            <b>创建仓库</b>：打开 <a href="https://github.com/new" target="_blank" rel="noreferrer">github.com/new</a>，
            填仓库名（如 <code>my-reeden-themes</code>），建议选 <b>Private</b>，点 Create repository。
          </li>
          <li>
            <b>创建 Token</b>：打开
            <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">github.com/settings/tokens</a>
            → Generate new token (classic)，Note 随意填写，勾选 <b>repo</b> 权限，拉到底部点 Generate。
            生成的 <code>ghp_…</code> 只显示一次，立即复制。
          </li>
          <li>
            <b>填写上方表单</b>：Token 粘到第一项，"仓库所有者"填你的 GitHub 用户名，"仓库名"填第 1 步创建的名字，
            存放目录保持默认 <code>themes/</code> 即可。
          </li>
          <li>
            <b>保存并开始用</b>：保存后，新导入的主题会自动上传备份；换设备或误删后，
            用下方"查看仓库主题"选择需要恢复的主题拉回，或直接从仓库删除不再需要的主题。
          </li>
        </ol>
        <p class="tutorial-note">注意：Token 保存在浏览器 localStorage，清理浏览器站点数据后需重新填写。</p>
      </div>

      <div class="form-row">
        <label>Personal Access Token</label>
        <input v-model="form.token" type="password" placeholder="ghp_xxxxxxxxxxxxxxxx" autocomplete="off" />
        <span class="hint">
          在
          <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">github.com/settings/tokens</a>
          创建 classic token，勾选 <b>repo</b> 权限
        </span>
      </div>

      <div class="form-row">
        <label>仓库所有者（用户名）</label>
        <input v-model="form.owner" placeholder="your-username" />
      </div>

      <div class="form-row">
        <label>仓库名</label>
        <input v-model="form.repo" placeholder="my-reeden-themes（需提前在 GitHub 创建）" />
      </div>

      <div class="form-row">
        <label>存放目录</label>
        <input v-model="form.path" placeholder="themes/" />
        <span class="hint">仓库内的目录路径，留空则存到根目录；默认 <b>themes/</b></span>
      </div>

      <div class="form-row">
        <label>从仓库恢复 / 管理</label>
        <button
          class="btn"
          :disabled="!form.token.trim() || !form.owner.trim() || !form.repo.trim()"
          @click="restore"
        >查看仓库主题…</button>
        <span class="hint">列出仓库中的 .red 文件，可选择需要恢复的，或从仓库中删除不再需要的主题</span>
      </div>

      <div class="dialog-actions">
        <button class="btn" @click="state.settingsOpen = false">取消</button>
        <button class="btn btn-primary" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>
