<script setup>
import { computed, ref } from 'vue'
import { state } from '../lib/store.js'
import {
  readerConfig, readerTypography, toHex, rgba, alphaOf, themeModes,
  resolveRuleColor, resolveRuleTextColor, resolveRuleBgColor
} from '../lib/theme-ui.js'

const tab = ref('overview')

const theme = computed(() => state.activeTheme)
const modes = computed(() => themeModes(theme.value))
const hasDark = computed(() => modes.value.includes('dark'))
const modeLabel = computed(() =>
  modes.value.length >= 2 ? '日间 + 夜间' : modes.value[0] === 'dark' ? '仅夜间' : '仅日间'
)
// 配色展示使用"原始配置"（不做日夜合并），这样能看出作者到底配了哪些字段；
// 夜间缺失而日间存在的字段标"继承日间"，与预览的实际合并行为一致
const rawLight = computed(() => theme.value?.app?.light || null)
const rawDark = computed(() => (hasDark.value ? theme.value?.app?.dark || {} : null))
const anyReader = computed(() =>
  theme.value ? readerConfig(theme.value, 'light') || readerConfig(theme.value, 'dark') : null
)
const typo = computed(() => readerTypography(anyReader.value || {}))

// 颜色字段的中文名（未列出的字段按 camelCase 自动拆分）。
// 名称来自真实主题包 app 配置统计（14 个主题全量验证）
const COLOR_LABELS = {
  backgroundColor: '页面背景',
  foregroundColor: '主要文字',
  mutedForegroundColor: '次级文字',
  cardColor: '卡片背景',
  cardForegroundColor: '卡片文字',
  popoverColor: '弹窗背景',
  dialogBackgroundColor: '对话框背景',
  mutedColor: '弱化背景',
  borderColor: '边框色',
  dividerColor: '分割线',
  inputBackgroundColor: '输入框背景',
  inputBorderColor: '输入框边框',
  searchFieldBackgroundColor: '搜索框背景',
  tabBackgroundColor: '标签页背景',
  shelfColor: '书架背景',
  accentColor: '强调色',
  primaryColor: '主色',
  textColor: '文字色',
  cardBackgroundColor: '卡片背景',
  readerBackgroundColor: '阅读背景'
}
const COLOR_KEY_ORDER = [
  'backgroundColor', 'shelfColor', 'cardColor', 'cardBackgroundColor',
  'foregroundColor', 'textColor', 'cardForegroundColor', 'mutedForegroundColor',
  'accentColor', 'primaryColor',
  'searchFieldBackgroundColor', 'inputBackgroundColor', 'inputBorderColor',
  'tabBackgroundColor', 'popoverColor', 'dialogBackgroundColor',
  'borderColor', 'dividerColor', 'mutedColor'
]

function colorLabel(key) {
  if (COLOR_LABELS[key]) return COLOR_LABELS[key]
  return key.replace(/Color$/i, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2')
}

/** 取配置里所有颜色类字段；非字符串/非颜色值（渐变对象等）照实展示但不画色块 */
function colorEntry(cfg, key) {
  const raw = cfg?.[key]
  if (raw === undefined || raw === null || raw === '') return null
  if (typeof raw === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw.trim())) {
    const hex = raw.trim()
    return { key, label: colorLabel(key), hex, dot: rgba(hex, 1, '#ffffff'), alpha: alphaOf(hex) }
  }
  if (typeof raw === 'string' && /^rgba?\(/i.test(raw.trim())) {
    return { key, label: colorLabel(key), hex: raw.trim(), dot: raw.trim(), alpha: null }
  }
  let text = raw
  if (typeof raw === 'object') {
    try { text = JSON.stringify(raw) } catch { text = String(raw) }
  }
  return { key, label: colorLabel(key), hex: String(text), dot: null, alpha: null }
}

function colorRows(cfg, fallbackCfg) {
  const keys = new Set([
    ...Object.keys(cfg || {}),
    ...Object.keys(fallbackCfg || {})
  ].filter(k => /color$/i.test(k)))
  return [...keys].sort((a, b) => {
    const ia = COLOR_KEY_ORDER.indexOf(a); const ib = COLOR_KEY_ORDER.indexOf(b)
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    return a.localeCompare(b)
  }).map(key => {
    const own = colorEntry(cfg, key)
    if (own) return own
    // 本模式未配置：若回退配置里有，标明继承（与预览实际效果一致）
    const inherited = colorEntry(fallbackCfg, key)
    return inherited
      ? { ...inherited, inherited: true }
      : { key, label: colorLabel(key), hex: '', dot: null, alpha: null, missing: true }
  })
}

const lightColorRows = computed(() => (rawLight.value ? colorRows(rawLight.value) : []))
const darkColorRows = computed(() => (rawDark.value ? colorRows(rawDark.value, rawLight.value) : []))
// 每套阅读方案单独列出颜色（日夜可能是完全不同的配色）
const readerColorGroups = computed(() => {
  if (!theme.value) return []
  return theme.value.readers.map((r, i) => {
    const mode = r.themeMode || (theme.value.readers.length >= 2 ? (i === 0 ? 'light' : 'dark') : null)
    const name = r.name || r.schemeName || r.colorSchemaName ||
      (mode === 'dark' ? `夜间方案 ${theme.value.readers.length >= 2 ? '' : i + 1}` : `日间方案 ${theme.value.readers.length >= 2 ? '' : i + 1}`)
    return { name, mode, rows: colorRows(r) }
  })
})

function fmtSize(n) {
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024).toFixed(0)} KB`
}

const images = computed(() => theme.value?.assets.filter(a => a.type === 'image') || [])
const jsons = computed(() => theme.value?.assets.filter(a => a.type === 'json') || [])

/** 美化输出；layoutConfig 等字符串化的 JSON 字段先尝试展开 */
function pretty(data) {
  const clone = (node, depth = 0) => {
    if (depth > 6 || !node || typeof node !== 'object') return node
    if (Array.isArray(node)) return node.map(n => clone(n, depth + 1))
    const out = {}
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string' && (v[0] === '{' || v[0] === '[')) {
        try {
          out[k] = clone(JSON.parse(v), depth + 1)
          continue
        } catch { /* 保留原字符串 */ }
      }
      out[k] = clone(v, depth + 1)
    }
    return out
  }
  try {
    return JSON.stringify(clone(data), null, 2)
  } catch {
    return String(data)
  }
}

function countByRole(role) {
  return images.value.filter(i => i.role === role).length
}

// 高亮规则 + 解析后的实际颜色
const ruleColorViews = computed(() => {
  if (!theme.value) return []
  const primary = toHex(anyReader.value?.primaryColor, '#c2410c')
  return theme.value.highlightRules.map(r => {
    const hashInCss = (String(r.styleCssText || '').match(/url\(\s*['"]?([0-9a-f]{32})['"]?\s*\)/i) || [])[1]
    const patternHash = r._patternHash || (hashInCss ? hashInCss.toUpperCase() : null)
    const pattern = patternHash ? theme.value.imageByHash?.get(patternHash) : null
    const styleType = String(r.styleType || '').toLowerCase()
    const textColor = resolveRuleTextColor(r, primary, '')
    const bgColor = resolveRuleBgColor(r, primary)
    return {
      name: r.name || '未命名规则',
      color: resolveRuleColor(r, primary),
      textColor,
      bgColor,
      kind: styleType === 'background' ? '背景色' : '文字色',
      colorType: r.styleColorType === 'accent' ? '跟随强调色' : (r.styleColorType || '默认'),
      enabled: r.enabled !== false,
      patternUrl: pattern?.url || null
    }
  })
})
</script>

<template>
  <aside class="panel detail">
    <div class="panel-head">
      <h2>主题分析</h2>
      <span v-if="theme" class="resource-tag" :class="{ gray: theme.isResourceOnly }">
        {{ theme.isResourceOnly ? theme.resourceKind : '应用主题' }}
      </span>
    </div>

    <div class="detail-tabs">
      <button :class="{ active: tab === 'overview' }" @click="tab = 'overview'">概览</button>
      <button :class="{ active: tab === 'assets' }" @click="tab = 'assets'">资源</button>
      <button :class="{ active: tab === 'config' }" @click="tab = 'config'">配置</button>
    </div>

    <div class="panel-body">
      <div v-if="!theme" class="empty-hint">
        <span class="big">ⓘ</span>
        请选择一个主题查看绑定关系、配色与原始配置
      </div>

      <!-- 概览 -->
      <template v-else-if="tab === 'overview'">
        <div v-for="w in theme.warnings" :key="w" class="warn-box">{{ w }}</div>

        <div class="kv-group">
          <h3>文件概览</h3>
          <div class="kv-row"><span class="k">标题</span><span class="v">{{ theme.title }}</span></div>
          <div class="kv-row"><span class="k">文件</span><span class="v">{{ theme.fileName }}</span></div>
          <div class="kv-row"><span class="k">大小</span><span class="v">{{ fmtSize(theme.size) }}</span></div>
          <div class="kv-row">
            <span class="k">容器</span>
            <span class="v">v{{ theme.header.version ?? '?' }} · {{ theme.header.assetMode || theme.header.container }}</span>
          </div>
          <div class="kv-row">
            <span class="k">资源</span>
            <span class="v">{{ images.length }} 图片 / {{ jsons.length }} JSON</span>
          </div>
        </div>

        <div v-if="!theme.isResourceOnly" class="kv-group">
          <h3>内置与绑定</h3>
          <div class="kv-row"><span class="k">模式</span><span class="v">{{ modeLabel }}</span></div>
          <div class="kv-row"><span class="k">应用主题配置</span><span class="v">✓</span></div>
          <div class="kv-row"><span class="k">阅读配色方案</span><span class="v">{{ theme.readers.length }} 套</span></div>
          <div class="kv-row"><span class="k">封面图库配置</span><span class="v">{{ theme.galleries.length }} 份</span></div>
          <div class="kv-row"><span class="k">底栏配置</span><span class="v">{{ theme.navbar ? '✓' : '—' }}</span></div>
          <div class="kv-row"><span class="k">启动页配置</span><span class="v">{{ theme.splashes?.length ? `✓ ${theme.splashes.length} 套` : '—' }}</span></div>
          <div class="kv-row"><span class="k">高亮规则</span><span class="v">{{ theme.highlightRules.length }} 条</span></div>
        </div>

        <div v-if="!theme.isResourceOnly && ruleColorViews.length" class="kv-group">
          <h3>高亮颜色</h3>
          <div v-for="(r, i) in ruleColorViews" :key="i" class="kv-row rule-row">
            <span class="k">
              <span class="color-dot" :style="{ background: r.textColor || r.color }"></span>{{ r.name }}
              <span v-if="!r.enabled" class="rule-off">已停用</span>
            </span>
            <span class="v">
              <img
                v-if="r.patternUrl"
                :src="r.patternUrl"
                alt="绑定图案"
                title="该规则绑定了背景图案"
                class="rule-pattern-thumb"
              />
              <span v-if="r.patternUrl" class="pattern-tag">图案</span>
              <span v-if="r.textColor" class="pattern-tag" title="规则对匹配文字生效的颜色">文字色</span>
              <span v-else-if="r.bgColor" class="pattern-tag" title="规则对匹配内容施加的背景底色" style="background:#e8f5e9;color:#2e7d32">背景</span>
              {{ r.color }} · {{ r.kind }} · {{ r.colorType }}
            </span>
          </div>
        </div>

        <div v-if="!theme.isResourceOnly" class="kv-group">
          <h3>图片绑定</h3>
          <div class="kv-row">
            <span class="k">书架头图</span>
            <span class="v">{{ countByRole('书架背景') ? `✓ ${countByRole('书架背景')} 张` : '—' }}</span>
          </div>
          <div class="kv-row">
            <span class="k">书架轮播图</span>
            <span class="v">{{ countByRole('书架轮播图') ? `✓ ${countByRole('书架轮播图')} 张` : '—' }}</span>
          </div>
          <div class="kv-row">
            <span class="k">封面图库</span>
            <span class="v">{{ countByRole('封面图库') }} 张</span>
          </div>
          <div class="kv-row">
            <span class="k">底栏图标</span>
            <span class="v">{{ countByRole('底栏图标') }} 张</span>
          </div>
          <div class="kv-row">
            <span class="k">阅读背景</span>
            <span class="v">{{ countByRole('阅读背景') }} 张</span>
          </div>
          <div class="kv-row">
            <span class="k">启动页</span>
            <span class="v">{{ countByRole('启动页') }} 张</span>
          </div>
          <div class="kv-row">
            <span class="k">高亮图案</span>
            <span class="v">{{ countByRole('高亮图案') ? `✓ ${countByRole('高亮图案')} 张` : '—' }}</span>
          </div>
        </div>

        <!-- 书架/界面配色：列出配置里所有 *Color 字段，色块 + 值，缺失标"未配置" -->
        <div v-if="!theme.isResourceOnly && lightColorRows.length" class="kv-group">
          <h3>日间配色（{{ lightColorRows.length }} 项）</h3>
          <div v-for="r in lightColorRows" :key="'l' + r.key" class="kv-row color-row">
            <span class="k">{{ r.label }}</span>
            <span class="v color-val">
              <template v-if="r.hex">
                <span v-if="r.dot" class="color-dot" :style="{ background: r.dot }"></span>
                <code>{{ r.hex }}</code>
                <span v-if="r.alpha !== null && r.alpha < 1" class="alpha-tag">不透明度 {{ Math.round(r.alpha * 100) }}%</span>
              </template>
              <span v-else class="missing-tag">未配置</span>
            </span>
          </div>
        </div>

        <div v-if="!theme.isResourceOnly && hasDark" class="kv-group">
          <h3>夜间配色（{{ darkColorRows.length }} 项）</h3>
          <div v-for="r in darkColorRows" :key="'d' + r.key" class="kv-row color-row">
            <span class="k">{{ r.label }}</span>
            <span class="v color-val">
              <template v-if="r.hex">
                <span v-if="r.dot" class="color-dot" :style="{ background: r.dot }"></span>
                <code>{{ r.hex }}</code>
                <span v-if="r.alpha !== null && r.alpha < 1" class="alpha-tag">不透明度 {{ Math.round(r.alpha * 100) }}%</span>
                <span v-if="r.inherited" class="inherit-tag" title="夜间未配置该字段，预览时沿用日间值">继承日间</span>
              </template>
              <span v-else class="missing-tag">未配置</span>
            </span>
          </div>
        </div>

        <!-- 阅读配色：每套方案单独一组（日夜可能完全不同） -->
        <div
          v-for="(g, gi) in readerColorGroups"
          :key="'rg' + gi"
          class="kv-group"
        >
          <h3>
            阅读配色 · {{ g.name }}
            <span v-if="g.mode === 'dark'" class="mode-tag dark">夜</span>
            <span v-else-if="g.mode === 'light'" class="mode-tag">日</span>
          </h3>
          <div v-if="!g.rows.length" class="empty-hint" style="padding:4px 0">该方案没有颜色字段</div>
          <div v-for="r in g.rows" :key="gi + r.key" class="kv-row color-row">
            <span class="k">{{ r.label }}</span>
            <span class="v color-val">
              <template v-if="r.hex">
                <span v-if="r.dot" class="color-dot" :style="{ background: r.dot }"></span>
                <code>{{ r.hex }}</code>
                <span v-if="r.alpha !== null && r.alpha < 1" class="alpha-tag">不透明度 {{ Math.round(r.alpha * 100) }}%</span>
              </template>
              <span v-else class="missing-tag">未配置</span>
            </span>
          </div>
        </div>

        <div v-if="anyReader" class="kv-group">
          <h3>阅读排版</h3>
          <div class="kv-row"><span class="k">字号</span><span class="v">{{ typo.fontSize }} px</span></div>
          <div class="kv-row"><span class="k">行高倍数</span><span class="v">{{ typo.lineHeight }}</span></div>
          <div class="kv-row"><span class="k">左右边距</span><span class="v">{{ typo.paddingX }} px</span></div>
          <div class="kv-row"><span class="k">段落间距</span><span class="v">{{ typo.paragraphGap }} px</span></div>
        </div>
      </template>

      <!-- 资源 -->
      <template v-else-if="tab === 'assets'">
        <div class="kv-group">
          <h3>图片（{{ images.length }}）</h3>
          <div v-for="img in images" :key="img.id" class="kv-row" style="align-items:center">
            <span class="k" style="display:flex;align-items:center;gap:9px">
              <img
                :src="img.url"
                :alt="img.role"
                style="width:34px;height:34px;object-fit:cover;border-radius:8px;border:1px solid var(--line)"
              />
              <span>
                {{ img.role }}
                <span v-if="img.width" style="color:var(--muted);display:block;font-size:10.5px">
                  {{ img.width }}×{{ img.height }}
                </span>
              </span>
            </span>
            <span class="v" style="font-size:11px">{{ fmtSize(img.size) }}</span>
          </div>
          <div v-if="!images.length" class="empty-hint">包内没有图片</div>
        </div>

        <div class="kv-group">
          <h3>配置文件（{{ jsons.length }}）</h3>
          <div v-for="j in jsons" :key="j.id" class="kv-row">
            <span class="k">{{ j.path || '(顺序资源)' }}</span>
            <span class="v">
              <span class="resource-tag" :class="{ gray: j.role === '未分类' }">{{ j.role }}</span>
            </span>
          </div>
        </div>
      </template>

      <!-- 原始配置 -->
      <template v-else>
        <details
          v-for="(j, i) in jsons"
          :key="j.id"
          class="config-block"
        >
          <summary>
            {{ j.role }}
            <span style="color:var(--muted);font-weight:400">{{ j.path || `#${i + 1}` }}</span>
          </summary>
          <pre>{{ pretty(j.data) }}</pre>
        </details>
      </template>
    </div>
  </aside>
</template>
