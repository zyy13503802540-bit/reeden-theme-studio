<script setup>
import { state } from '../lib/store.js'

const emit = defineEmits(['import', 'open-settings', 'clear-all'])

function onFileChange(event) {
  if (event.target.files?.length) emit('import', event.target.files)
  event.target.value = ''
}
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark">R</div>
      <div>
        <div class="brand-title">Reeden 主题工作室</div>
        <div class="brand-sub">本地持久 · GitHub 同步</div>
      </div>
    </div>

    <div class="search-box">
      <span class="ic">⌕</span>
      <input v-model="state.query" type="search" placeholder="搜索主题名称或作者" />
    </div>

    <div class="topbar-spacer" />

    <div
      class="sync-badge"
      :class="[state.sync.kind, { clickable: state.sync.kind === 'error' }]"
      :title="state.sync.kind === 'error' ? '点击查看完整报错' : ''"
      @click="state.sync.kind === 'error' && (state.syncErrorOpen = true)"
    >
      <span class="dot" />
      <span class="badge-text">{{ state.sync.text }}</span>
    </div>

    <button class="btn" @click="emit('open-settings')">设置</button>
    <button class="btn btn-danger" @click="emit('clear-all')">清空</button>

    <label class="btn btn-primary" for="file-input">导入 .red</label>
    <input id="file-input" type="file" accept=".red" multiple @change="onFileChange" />
  </header>
</template>
