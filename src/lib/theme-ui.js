// 主题预览的展示辅助：颜色归一化、模式/阅读配置选择、高亮规则渲染
import { normalizeLayout } from './red/index.js'

/** 8 位 AARRGGBB / 6 位 RRGGBB / 3 位简写 → #RRGGBB */
export function toHex(value, fallback = '#ffffff') {
  if (typeof value !== 'string' || !value) return fallback
  let hex = value.replace('#', '').trim()
  if (hex.length === 8) hex = hex.slice(2)
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return fallback
  return `#${hex.toLowerCase()}`
}

export function alphaOf(value, fallback = 1) {
  if (typeof value !== 'string') return fallback
  const hex = value.replace('#', '').trim()
  return hex.length === 8 ? parseInt(hex.slice(0, 2), 16) / 255 : fallback
}

export function rgba(value, opacity = 1, fallback = '#ffffff') {
  const hex = toHex(value, fallback).slice(1)
  const a = Math.max(0, Math.min(1, alphaOf(value, 1) * opacity))
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/**
 * 判断主题实际支持的模式。
 * 注意：很多主题包的 app.dark 只是打包模板自带的默认深色配色骨架
 * （纯黑底 + 十几个 color 字段，无任何图片/启动页/阅读配置绑定，也没有夜间 reader），
 * 作者并未真正配置夜间，这种不能算作支持夜间。
 * 真夜间的判据：显式 enabled === true，或绑定了夜间专属资源，或存在 themeMode=dark 的阅读配置。
 */
const DARK_CONTENT_KEYS = [
  'backgroundImage',
  'cardBackgroundImage',
  'customSplashId',
  'coverGalleryId',
  'navbarPackId',
  'readerColorSchemaId',
  'bookshelfCarouselImageUrls',
  'bookshelfCarouselManifestId'
]

export function themeModes(theme) {
  const app = theme?.app
  if (!app) return []
  const modes = []
  if (app.light) modes.push('light')
  const dark = app.dark
  if (dark && dark.enabled !== false) {
    const hasDarkContent =
      dark.enabled === true ||
      DARK_CONTENT_KEYS.some(k => {
        const v = dark[k]
        if (v === undefined || v === null || v === '') return false
        if (Array.isArray(v) && !v.length) return false
        return true
      }) ||
      (theme.readers || []).some(r => r.themeMode === 'dark')
    if (hasDarkContent) modes.push('dark')
  }
  return modes
}

export function modeConfig(theme, mode) {
  const app = theme.app
  if (!app) return {}
  const cfg = app[mode] || app.light || app.dark || {}
  if (mode === 'dark' && cfg.enabled === false) return app.light || cfg
  if (mode === 'dark' && app.light) {
    // dark 往往只覆盖部分字段：缺失的颜色类字段回退到 light
    // 头图(backgroundImage)在 dark 未配置时也回退，保证深浅色都能预览到头图
    const merged = { ...cfg }
    for (const [key, value] of Object.entries(app.light)) {
      if (key in merged) continue
      if (/Color$/.test(key) || key === 'backgroundImage') merged[key] = value
    }
    return merged
  }
  return cfg
}

/** 当前模式下最合适的阅读配色 */
export function readerConfig(theme, mode) {
  const readers = theme.readers
  if (!readers.length) return null
  const exact = readers.find(r => r.themeMode === mode)
  if (exact) return exact
  if (readers.length > 1 && theme.app?.light?.readerColorSchemaId) {
    return mode === 'dark' ? readers[readers.length - 1] : readers[0]
  }
  return (
    readers.find(r => Boolean(normalizeLayout(r).useDarkMode) === (mode === 'dark')) ||
    readers[0]
  )
}

/** 阅读排版数值，按手机预览宽度做温和 clamp */
export function readerTypography(reader) {
  const layout = normalizeLayout(reader)
  const num = (v, d) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : d
  }
  return {
    fontSize: Math.min(22, Math.max(12, num(layout.fontSize, 15))),
    lineHeight: Math.min(2.4, Math.max(1.4, num(layout.lineSpacing, 1.8))),
    paddingX: Math.min(28, Math.max(12, num(layout.paddingLeft ?? layout.padding, 18))),
    paddingTop: Math.min(40, Math.max(16, num(layout.paddingTop, 26))),
    paragraphGap: Math.min(18, Math.max(6, num(layout.paragraphSpacing, 10))),
    align: /center|right/i.test(layout.textAlign || '') ? layout.textAlign.toLowerCase() : 'left'
  }
}

export function imageForHash(theme, hash) {
  if (!hash) return ''
  return theme.imageByHash?.get(String(hash).toUpperCase())?.url || ''
}

export function imagesByRole(theme, role) {
  const seen = new Set()
  return theme.assets
    .filter(a => a.type === 'image' && a.role === role)
    .filter(a => (seen.has(a.hash) ? false : seen.add(a.hash)))
}

/**
 * 识别 byType 底栏包里的"公共底板"：图标与底板成对排列（[图,底,图,底…]），
 * 底板 hash 在奇数（或偶数）位置恒定重复 ≥3 次，而另一位置组每张都不同。
 * 返回底板 hash；不满足该模式时返回 null（重复图本身就是图标的包不能剔除）。
 */
function detectBaseplate(hashes) {
  if (hashes.length < 6) return null
  const even = hashes.filter((_, i) => i % 2 === 0)
  const odd = hashes.filter((_, i) => i % 2 === 1)
  const allSame = arr => arr.length >= 3 && arr.every(h => h === arr[0])
  const allDistinct = arr => new Set(arr).size === arr.length
  if (allSame(odd) && allDistinct(even)) return odd[0]
  if (allSame(even) && allDistinct(odd)) return even[0]
  return null
}

/**
 * 当前模式下用于预览的底栏图标列表（≤5 张），每项为 { url, mono }。
 * mono=true 表示是单色 SVG，预览端用 CSS mask 按主题强调色染色
 * （App 运行时也是染色显示；夜间模式下纯黑 SVG 不染色会不可见）。
 * - 顺序包图标带 _navMode（日/夜各一套），按模式选取；夜间缺套时回退日间
 * - ZIP 包图标无模式标记，作为共享集合
 * - 剔除公共底板，再按 hash 去重
 */
export function navIconsForMode(theme, mode) {
  const imgs = (theme?.assets || []).filter(a => a.type === 'image' && a.role === '底栏图标')
  const build = list => {
    const hashes = list.map(a => a.hash)
    const baseplate = detectBaseplate(hashes)
    const out = []
    const seen = new Set()
    for (const a of list) {
      if (baseplate && a.hash === baseplate) continue
      if (seen.has(a.hash)) continue
      seen.add(a.hash)
      out.push({ url: a.url, mono: a.mime === 'image/svg+xml' && !!a.mono })
    }
    return out.slice(0, 5)
  }
  const exact = imgs.filter(a => a._navMode === mode)
  if (exact.length) return build(exact)
  const shared = imgs.filter(a => !a._navMode)
  if (shared.length) return build(shared)
  const light = imgs.filter(a => a._navMode === 'light')
  if (light.length) return build(light)
  return build(imgs)
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  )
}

function ruleExpression(rule) {
  let pattern = rule.regex || rule.pattern || rule.matchText || rule.keyword || rule.expression || ''
  if (
    !pattern &&
    /对话|括号|dialogue|bracket/i.test(String(rule.name || rule.title || rule.preset || ''))
  ) {
    pattern = '【[^】]+】'
  }
  // 标题强调类规则无 pattern 时，匹配段落首句作为标题
  if (
    !pattern &&
    (rule.titleOnly || /标题|title|heading/i.test(String(rule.name || rule.title || rule.preset || '')))
  ) {
    pattern = '^[^。！？\\n]{2,30}[。！？]?'
  }
  if (typeof pattern !== 'string' || !pattern || pattern.length > 200) return null
  if (/^\/.+\/[a-z]*$/i.test(pattern)) pattern = pattern.slice(1, pattern.lastIndexOf('/'))
  try {
    return new RegExp(pattern, 'gmu')
  } catch {
    try {
      return new RegExp(pattern, 'g')
    } catch {
      return null
    }
  }
}

/**
 * 高亮规则颜色解析
 * styleColorType:
 *  - "accent"：跟随阅读主题强调色（reader.primaryColor）
 *  - 内置色板名（brown/red/orange/yellow/green/blue/purple/pink...）
 *  - 或直接是十六进制色值
 * 规则自身带 color/customColor 等显式色值时优先使用
 */
const HIGHLIGHT_PALETTE = {
  yellow: '#d9a82b',
  orange: '#dd7a2a',
  red: '#cf4a3e',
  pink: '#d3618b',
  purple: '#8a63b5',
  blue: '#3f73b5',
  cyan: '#2f9aa3',
  green: '#56884a',
  brown: '#9a6b43',
  gray: '#7a7a7a',
  grey: '#7a7a7a',
  black: '#222222',
  white: '#f5f5f5'
}

export function resolveRuleColor(rule, readerPrimary, fallback = '#c2410c') {
  if (!rule) return fallback
  // 1. 规则里的显式色值优先
  const explicit = rule.color || rule.textColor || rule.customColor || rule.styleColor || rule.style?.color
  if (typeof explicit === 'string' && /^#?[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(explicit.trim())) {
    return toHex(explicit, fallback)
  }
  // 2. 按 styleColorType 解析
  const type = String(rule.styleColorType || rule.colorType || '').trim().toLowerCase()
  if (!type) return fallback
  if (type === 'accent' || type === 'primary' || type === 'theme') {
    return readerPrimary || fallback
  }
  if (/^#?[0-9a-f]{6}([0-9a-f]{2})?$/i.test(type)) return toHex(type, fallback)
  return HIGHLIGHT_PALETTE[type] || fallback
}

/** 从 styleCssText 中提取某个颜色声明（color / background-color / background），占位符替换为规则颜色 */
function cssDeclColor(rule, prop, readerPrimary) {
  const css = String(rule?.styleCssText || rule?.style?.cssText || '')
  if (!css) return null
  // 用 (?:^|;) 锚定，避免 color 误匹配 background-color
  const re = new RegExp('(?:^|;)\\s*' + prop + '\\s*:\\s*([^;]+)', 'i')
  const m = css.match(re)
  if (!m) return null
  const ruleColor = resolveRuleColor(rule, readerPrimary)
  const v = m[1]
    .trim()
    .replace(/\{primaryColor\}/gi, ruleColor)
    .replace(/\{accentColor\}/gi, readerPrimary || ruleColor)
  if (/^#?[0-9a-f]{3}([0-9a-f]{3})?([0-9a-f]{2})?$/i.test(v)) return toHex(v)
  if (/^(rgb|hsl)a?\(/i.test(v)) return v
  return null
}

/** 高亮规则的实际文字颜色：cssText 的 color 声明优先；简单模式 styleType=textColor 用选定色 */
export function resolveRuleTextColor(rule, readerPrimary, fallback = '') {
  if (!rule) return fallback
  const fromCss = cssDeclColor(rule, 'color', readerPrimary)
  if (fromCss) return fromCss
  const type = String(rule.styleType || '').toLowerCase()
  if (type === 'textcolor' || type === 'text' || !type) {
    return resolveRuleColor(rule, readerPrimary, fallback || '#c2410c')
  }
  return fallback
}

/** 高亮规则的背景色：cssText background 声明，或简单模式 styleType=background 的选定色 */
export function resolveRuleBgColor(rule, readerPrimary) {
  if (!rule) return null
  const fromCss =
    cssDeclColor(rule, 'background-color', readerPrimary) || cssDeclColor(rule, 'background', readerPrimary)
  if (fromCss) return fromCss
  const type = String(rule.styleType || '').toLowerCase()
  if (type === 'background') return resolveRuleColor(rule, readerPrimary)
  return null
}

/** 解析高亮规则绑定的图案地址（内嵌图案或包内图片哈希） */
export function resolveRuleImage(rule, theme) {
  if (!rule || !theme) return null
  const map = theme.imageByHash
  if (rule._patternHash && map?.get(rule._patternHash)?.url) {
    return map.get(rule._patternHash).url
  }
  const css = String(rule.styleCssText || rule.style?.cssText || '')
  const m = css.match(/url\(\s*['"]?([0-9a-f]{32})['"]?\s*\)/i)
  if (m) return map?.get(m[1].toUpperCase())?.url || null
  return null
}

/**
 * 把规则的 styleCssText 转成可用于内联 style 的安全字符串：
 * 替换颜色占位符、把图案哈希换成实际图片地址、剔除私有属性与无法解析的背景图。
 * opts.inline：正文内联高亮（对话气泡等）—— padding 收紧、图案拉伸贴合文字盒，
 * 不使用主题按真机原图规定的大尺寸
 * opts.dropcap：首字下沉（float:left 的大字号单字）—— 放宽 padding、修正塌缩的行高，
 * 让图案完整包裹放大后的字
 */
function buildRuleCssText(rule, theme, readerPrimary, opts = {}) {
  let css = rule.styleCssText || rule.style?.cssText || ''
  if (typeof css !== 'string' || !css) return ''
  const color = resolveRuleColor(rule, readerPrimary)
  css = css.replace(/\{primaryColor\}/gi, color)
    .replace(/\{accentColor\}/gi, readerPrimary || color)
    .replace(/\{[^}]+\}/g, 'inherit')

  const imgUrl = resolveRuleImage(rule, theme)
  if (imgUrl) {
    css = css.replace(/url\(\s*['"]?[^)'"]*['"]?\s*\)/, `url('${imgUrl}')`)
  } else {
    // 引用了哈希但包内/内嵌都找不到图：移除该背景图声明，避免失效样式
    css = css.replace(/background-image\s*:[^;]*;?/gi, '')
  }

  // reeden 私有语义，过滤前先提取：
  // reeden-background-height: half → 半高荧光笔效果，图案只铺在文字的下半部分
  const halfHeight = /reeden-background-height\s*:\s*half/i.test(css)

  // 图案规则的 padding 是按真机原图像素设计的（可能上百 px）：
  // 内联高亮收紧到 6px 贴合文字；首字下沉的 padding 本身就是图案框的一部分，放宽到 40px；
  // 块级/标题钳制到 24px 避免撑爆
  const maxPad = opts.dropcap ? 40 : opts.inline ? 6 : 24
  let out = css
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => !/^(reeden-|--)/i.test(s))
    // reeden-font:hash 是 App 内嵌字体引用，浏览器无法解析，剔除避免噪音
    .filter(s => !/^font-family\s*:\s*['"]?reeden-font:/i.test(s))
    .map(s => {
      if (/^padding(-top|-right|-bottom|-left)?\s*:/i.test(s)) {
        return s.replace(/-?\d+(?:\.\d+)?px/g, n => {
          const v = parseFloat(n)
          return `${Math.abs(v) > maxPad ? maxPad : v}px`
        })
      }
      return s
    })
    .join(';')
    .replace(/"/g, "'")

  if ((opts.inline || opts.dropcap) && /background-image/i.test(out)) {
    // 图案贴合文字，不重复平铺；垂直 margin 按真机设计会让气泡错位，剥离
    out = out.replace(/background-size\s*:[^;]*;?/gi, '')
      .replace(/background-repeat\s*:[^;]*;?/gi, '')
      .replace(/background-position\s*:[^;]*;?/gi, '')
    if (halfHeight) {
      // 半高荧光笔：图案只占文字行高的下半部分，像马克笔划过
      out += ';background-size:100% 55%;background-position:center bottom;background-repeat:no-repeat'
    } else {
      out += ';background-size:100% 100%;background-repeat:no-repeat;background-position:center'
    }
  }
  if (opts.inline || opts.dropcap) {
    out = out.split(';')
      .filter(s => !/^\s*margin-(top|bottom)\s*:/i.test(s))
      .join(';')
    out += ';-webkit-box-decoration-break:clone;box-decoration-break:clone'
  }
  if (opts.dropcap) {
    // 主题给的 line-height 接近 0（真机按像素精排），浏览器里浮动盒高度会塌缩、图案被压扁；
    // 改成按字号成行，保证图案盒完整包住放大首字
    out = out.split(';')
      .filter(s => !/^\s*line-height\s*:/i.test(s))
      .join(';')
    out += ';line-height:1;text-align:center'
  }
  return out
}

/** 规则签名：同名同表达式视为同一条语义规则 */
function ruleSignature(rule) {
  return `${rule.name || ''}|${rule.regex || rule.pattern || rule.matchText || ''}`
}

/**
 * 选出当前模式下生效的高亮规则：
 * - _mode 等于当前模式的专属规则
 * - 没有 _mode 的共享规则（同一签名下若已有模式专属规则，则共享规则让位，避免重复包裹）
 * - 另一模式的专属规则排除
 * 保留规则在合并列表中的原始顺序
 */
export function rulesForMode(rules, mode) {
  const all = rules || []
  const exactSigs = new Set()
  for (const r of all) {
    if (r._mode === mode) exactSigs.add(ruleSignature(r))
  }
  return all.filter(r => {
    if (r._mode === mode) return true
    if (!r._mode) return !exactSigs.has(ruleSignature(r))
    return false
  })
}

/** 把示例文本按高亮规则渲染成安全 HTML */
export function renderHighlighted(text, rules, baseTextColor, readerPrimary, theme) {
  let html = escapeHtml(text)
  // 已插入的标签用占位符保护：后续规则的正则只能整体跨越，不能切入标签内部
  // （否则贪婪正则会把 <span style="…"> 截断，CSS 就会作为文本显示出来）
  const tokens = []
  const pairs = [] // [openTokenIndex, closeTokenIndex]
  const protectPair = (openMarkup, inner, closeMarkup) => {
    const oi = tokens.length
    tokens.push(openMarkup)
    const ci = tokens.length
    tokens.push(closeMarkup)
    pairs.push([oi, ci])
    return `\u0000${oi}\u0000${inner}\u0000${ci}\u0000`
  }
  /** 匹配区间里的标签是否成对完整；不完整（切入了已有标签）则不可包裹 */
  const balanced = segment => {
    const found = new Set()
    segment.replace(/\u0000(\d+)\u0000/g, (_, i) => {
      found.add(Number(i))
      return ''
    })
    for (const [o, c] of pairs) {
      if (found.has(o) !== found.has(c)) return false
    }
    return true
  }

  const usable = (rules || []).slice(0, 8)
  const isTitleRule = rule =>
    rule.titleOnly || /标题|title|heading/i.test(String(rule.name || rule.title || rule.preset || ''))
  for (const rule of usable) {
    // 标题类规则（含标题图案）不作用于正文段落，由阅读页标题单独渲染
    if (isTitleRule(rule)) continue
    const re = ruleExpression(rule)
    if (!re) continue
    const rawCss = String(rule.styleCssText || rule.style?.cssText || '')
    const isBlock = /display\s*:\s*block/i.test(rawCss)
    const isDropcap = /float\s*:\s*(left|right)/i.test(rawCss)
    const cssText = buildRuleCssText(rule, theme, readerPrimary, { inline: !isBlock, dropcap: isDropcap })
    const color = resolveRuleColor(rule, readerPrimary)
    const tag = isBlock ? 'div' : 'span'
    // 无 cssText 的简单模式规则：背景型高亮渲染为半透明底色，文字型渲染为文字颜色
    const bgColor = cssText ? null : resolveRuleBgColor(rule, readerPrimary)
    const fallbackCss = bgColor
      ? `background-color:${rgba(bgColor, 0.3)};border-radius:3px;`
      : `color:${color};`
    const inline = cssText || fallbackCss
    html = html.replace(re, m => {
      if (/^(&amp;|&lt;|&gt;|&quot;|&#39;)/.test(m)) return m
      // 匹配区间切入了已有标签（开/闭标签只剩一个）：放弃包裹，避免破坏 HTML
      if (!balanced(m)) return m
      return protectPair(
        `<${tag} style="${inline}">`,
        m,
        `</${tag}>`
      )
    })
  }
  return html.replace(/\u0000(\d+)\u0000/g, (_, i) => tokens[Number(i)])
}

/** 获取标题强调类高亮规则的样式字符串（用于阅读页标题，含绑定图案） */
export function titleRuleStyle(rules, readerPrimary, theme) {
  const rule = (rules || []).find(
    r => r.titleOnly || /标题|title|heading/i.test(r.name || r.title || r.preset || '')
  )
  if (!rule) return ''
  const color = resolveRuleColor(rule, readerPrimary)
  let css = buildRuleCssText(rule, theme, readerPrimary)
  // 标题图案完整显示（用 100% 100% 而非 cover，避免裁切），加浅色投影保证文字可读
  if (/background-image/i.test(css)) {
    css = css.replace(/background-size\s*:[^;]*;?/gi, '').replace(/background-repeat\s*:[^;]*;?/gi, '')
    css += ';background-size: 100% 100%;background-repeat: no-repeat;text-shadow: 0 1px 6px rgba(255,255,255,.9), 0 0 2px rgba(255,255,255,.8)'
  }
  return css || `color:${color};`
}

export const SAMPLE_PARAGRAPHS = [
  '她把信纸轻轻推过桌面，眼睛弯成一道桥。“你好呀。”窗外的雨停了，屋檐还在滴水，滴答、滴答，像谁在数着时间。',
  '他没有立刻回答，只是看着信封上那行熟悉的字迹。街角的咖啡店亮起暖黄色的灯，玻璃门上蒙着薄薄的雾气。',
  '风把窗帘吹起来，带进来一点晚香玉的气味。“有些话，”她笑着说，“写下来比说出口容易。”'
]

/** 阅读页页眉页脚展示用的模拟状态变量 */
const READER_STATUS_VARS = {
  page: '12',
  total: '86',
  chapter: '第一章 雨停之后',
  chapterNumber: '1',
  chapterTotal: '12',
  title: '山茶文具店',
  book: '山茶文具店',
  time12: '下午 3:24',
  time: '15:24',
  bookPage: '203',
  bookTotal: '412',
  bookPercent: '49%',
  batteryNumber: '86',
  battery: '🔋'
}

/** 内置状态栏项类型 → 默认模板（覆盖 Reeden 实际使用的枚举） */
const STATUS_ITEM_PRESETS = {
  page: '{page}/{total}',
  pageNumber: '{page}/{total}',
  pageInChapter: '{page}/{total}',
  pageInChapterPercent: '{bookPercent}',
  chapter: '{chapter}',
  chapterName: '{chapter}',
  chapterTitle: '{chapter}',
  bookTitle: '{title}',
  bookName: '{title}',
  time: '{time12}',
  time12: '{time12}',
  time24: '{time}',
  battery: '🔋{batteryNumber}%',
  batteryNumber: '{batteryNumber}%',
  batteryAndTime: '🔋{batteryNumber}% {time12}',
  batteryAndTime12: '🔋{batteryNumber}% {time12}',
  batteryAndTime24: '🔋{batteryNumber}% {time}',
  bookProgress: '{bookPage}/{bookTotal}',
  bookPageNumber: '{bookPage}/{bookTotal}',
  bookPercent: '{bookPercent}',
  readingTime: '{time}',
  network: 'WiFi',
  networkType: 'WiFi',
  wifi: 'WiFi'
}

function fillStatusTemplate(tpl) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (m, key) =>
    key in READER_STATUS_VARS ? READER_STATUS_VARS[key] : m
  ).trim()
}

/**
 * 解析阅读配置里绑定的页眉/页脚
 * 返回 { header: {left,center,right}, footer: {...}, headerFontSize, footerFontSize }
 * 每个位置为字符串（已替换占位符）或 null
 */
export function readerStatusBars(reader) {
  if (!reader) return { header: { left: null, center: null, right: null }, footer: { left: null, center: null, right: null } }
  let layout = reader.layoutConfig
  if (typeof layout === 'string') {
    try { layout = JSON.parse(layout) } catch { layout = {} }
  }
  layout = layout || {}

  const build = (bar, pos) => {
    const cap = bar === 'header' ? 'Header' : 'Footer'
    const typeKey = `statusItemType${cap}${pos[0].toUpperCase()}${pos.slice(1)}`
    const tplKey = `customTemplate${cap}${pos[0].toUpperCase()}${pos.slice(1)}`
    const type = layout[typeKey]
    if (!type || type === 'none') return null
    if (type === 'custom') return fillStatusTemplate(layout[tplKey]) || null
    const preset = STATUS_ITEM_PRESETS[type]
    return preset ? fillStatusTemplate(preset) : null
  }

  return {
    header: {
      left: build('header', 'left'),
      center: build('header', 'center'),
      right: build('header', 'right')
    },
    footer: {
      left: build('footer', 'left'),
      center: build('footer', 'center'),
      right: build('footer', 'right')
    },
    // 页眉页脚字号不读取主题配置，预览统一用固定小字号
    headerFontSize: 10,
    footerFontSize: 10
  }
}
