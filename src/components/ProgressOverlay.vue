<script setup>
import { state, dismissProgress } from '../lib/store.js'
</script>

<template>
  <div v-if="state.progress" class="overlay">
    <div class="dialog progress-dialog">
      <div class="big-ic">{{ state.progress.finished ? (state.progress.failed ? '⚠️' : '✅') : '📦' }}</div>
      <h2 style="margin-bottom:2px">
        {{ state.progress.finished ? '解析完成' : '正在解析主题' }}
      </h2>
      <div class="progress-current">{{ state.progress.current }}</div>

      <div class="progress-stats">
        <div class="stat">
          <div class="num" style="color:var(--accent)">{{ state.progress.ok }}</div>
          <div class="lbl">解析成功</div>
        </div>
        <div class="stat">
          <div class="num" style="color:var(--red)">{{ state.progress.failed }}</div>
          <div class="lbl">解析失败</div>
        </div>
        <div class="stat">
          <div class="num">{{ state.progress.total - state.progress.done }}</div>
          <div class="lbl">待处理</div>
        </div>
      </div>

      <div v-if="state.progress.failures.length" class="progress-failures">
        <div v-for="(f, i) in state.progress.failures" :key="i" class="f-row">
          {{ f.fileName }}
          <span>{{ f.error }}</span>
        </div>
      </div>

      <div class="dialog-actions" style="justify-content:center">
        <button v-if="!state.progress.finished" class="btn btn-danger" @click="state.progress.cancelled = true">
          取消处理
        </button>
        <button v-else class="btn btn-primary" @click="dismissProgress">关闭</button>
      </div>
    </div>
  </div>
</template>
