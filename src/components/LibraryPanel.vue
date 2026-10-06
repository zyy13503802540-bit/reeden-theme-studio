<script setup>
import { computed } from 'vue'
import { state, selectTheme, toggleFavorite, favoriteId, exportTheme } from '../lib/store.js'

const emit = defineEmits(['select', 'remove'])

function pick(uid) {
  selectTheme(uid)
  emit('select')
}

const filters = [
  { key: 'all', label: '全部' },
  { key: 'favorite', label: '收藏' },
  { key: 'resource', label: '配置资源' },
  { key: 'error', label: '解析异常' }
]

function thumbOf(theme) {
  // 缩略图优先级：封面图库 → 书架卡片图；绝不使用书架头图/阅读背景
  const covers = theme.assets.filter(a => a.type === 'image' && a.role === '封面图库')
  if (covers.length) return covers[0].url
  const card = theme.assets.find(a => a.type === 'image' && a.role === '书架卡片图')
  return card?.url || ''
}

function descOf(theme) {
  const imageCount = theme.assets.filter(a => a.type === 'image').length
  if (theme.isResourceOnly) {
    return `${theme.resourceKind} · ${theme.assets.filter(a => a.type === 'json').length} 份配置`
  }
  return `${imageCount} 张图片 · ${theme.readers.length} 套阅读配置`
}

const appCount = computed(() => state.themes.filter(t => !t.isResourceOnly).length)
const resCount = computed(() => state.themes.filter(t => t.isResourceOnly).length)

function countOf(key) {
  if (key === 'all') return appCount.value
  if (key === 'resource') return resCount.value
  if (key === 'error') return state.failures.length
  return state.themes.filter(t => state.favorites.has(favoriteId(t))).length
}
</script>

<template>
  <aside class="panel library">
    <div class="panel-head">
      <h2>主题列表 <span class="count-chip">{{ appCount }}</span></h2>
    </div>

    <div class="filter-row">
      <button
        v-for="f in filters"
        :key="f.key"
        class="chip"
        :class="{ active: state.filter === f.key }"
        @click="state.filter = f.key"
      >
        {{ f.label }}
        <template v-if="countOf(f.key)"> · {{ countOf(f.key) }}</template>
      </button>
    </div>

    <div v-if="state.filter === 'all' || state.filter === 'favorite'" class="inline-search">
      <input v-model="state.query" placeholder="在结果中筛选…" />
    </div>

    <div class="panel-body">
      <!-- 应用主题 -->
      <template v-if="state.filter === 'all' || state.filter === 'favorite'">
        <button
          v-for="theme in state.visibleThemes"
          :key="theme.uid"
          class="theme-card"
          :class="{ active: theme.uid === state.activeUid }"
          @click="pick(theme.uid)"
        >
          <span class="thumb" :style="thumbOf(theme) ? { backgroundImage: `url(${thumbOf(theme)})` } : {}" />
          <span class="meta">
            <span class="name">{{ theme.title }}</span>
            <span class="desc">{{ descOf(theme) }}</span>
          </span>
          <span
            class="fav-star"
            :class="{ on: state.favorites.has(favoriteId(theme)) }"
            @click.stop="toggleFavorite(theme)"
          >★</span>
          <span
            class="card-dl"
            title="下载该主题"
            @click.stop="exportTheme(theme.uid)"
          >⤓</span>
          <span
            class="card-del"
            title="删除该主题"
            @click.stop="emit('remove', theme)"
          >×</span>
        </button>
        <div v-if="!state.visibleThemes.length" class="empty-hint">
          <span class="big">❒</span>
          {{ state.filter === 'favorite' ? '还没有收藏的主题' : '还没有应用主题，导入 .red 文件后即可预览' }}
        </div>
      </template>

      <!-- 独立配置资源 -->
      <template v-else-if="state.filter === 'resource'">
        <button
          v-for="theme in state.resourceThemes"
          :key="theme.uid"
          class="theme-card"
          :class="{ active: theme.uid === state.activeUid }"
          @click="pick(theme.uid)"
        >
          <span class="thumb" style="background:linear-gradient(135deg,#e6f4f2,#cfe8e4)" />
          <span class="meta">
            <span class="name">{{ theme.title }}</span>
            <span class="desc">{{ descOf(theme) }}</span>
          </span>
          <span
            class="card-dl"
            title="下载该配置"
            @click.stop="exportTheme(theme.uid)"
          >⤓</span>
          <span
            class="card-del"
            title="删除该配置"
            @click.stop="emit('remove', theme)"
          >×</span>
        </button>
        <div v-if="!state.resourceThemes.length" class="empty-hint">
          <span class="big">⁂</span>
          导入的独立高亮规则、标题样式等配置会出现在这里
        </div>
      </template>

      <!-- 解析失败 -->
      <template v-else>
        <div v-for="(failure, i) in state.failures" :key="i" class="empty-hint" style="text-align:left;padding:12px 8px">
          <div class="error-text" style="font-weight:700;margin-bottom:3px">{{ failure.fileName }}</div>
          <div style="font-size:11.5px">{{ failure.error }}</div>
        </div>
        <div v-if="!state.failures.length" class="empty-hint">
          <span class="big">✓</span>
          没有解析失败的文件
        </div>
      </template>
    </div>
  </aside>
</template>
