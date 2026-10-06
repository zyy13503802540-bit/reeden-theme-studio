<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { state, shiftActive } from '../lib/store.js'
import {
  modeConfig,
  readerConfig,
  readerTypography,
  imageForHash,
  imagesByRole,
  rgba,
  toHex,
  renderHighlighted,
  rulesForMode,
  navIconsForMode,
  titleRuleStyle,
  readerStatusBars,
  themeModes,
  SAMPLE_PARAGRAPHS
} from '../lib/theme-ui.js'

const textSeed = ref(0)
function shuffleText() {
  textSeed.value++
}

const theme = computed(() => state.activeTheme)
// 独立配置资源（阅读主题等）：无书架/启动页配置，强制在阅读页预览（加密存档包除外，无内容可预览）
const isResourceOnly = computed(() => !!theme.value?.isResourceOnly)
watch(isResourceOnly, v => { if (v && theme.value?.readers?.length) state.page = 'reader' })
// 主题实际包含的模式（日间/夜间可能是两套完全不同的配置）；夜间缺失时禁用切换并回退日间
const availableModes = computed(() => themeModes(theme.value))
watch(availableModes, modes => {
  if (!modes.includes(state.mode)) state.mode = modes[0] || 'light'
})
const cfg = computed(() => (theme.value ? modeConfig(theme.value, state.mode) : {}))
const reader = computed(() => (theme.value ? readerConfig(theme.value, state.mode) : null))
// 阅读页预览排版固定：标题/正文的字数与位置不随主题变化，
// 主题的排版数值只在详情面板"阅读排版"中展示
const typo = computed(() => readerTypography({}))

const paragraphs = computed(() => {
  const list = [...SAMPLE_PARAGRAPHS]
  const shift = textSeed.value % list.length
  return list.slice(shift).concat(list.slice(0, shift))
})

/* ---------- 书架数据 ---------- */
const shelfBg = computed(() => imageForHash(theme.value, cfg.value.backgroundImage))
const cardImage = computed(() => imageForHash(theme.value, cfg.value.cardBackgroundImage))
const coverImages = computed(() => {
  if (!theme.value) return []
  // 严格只取识别为"封面图库"的图片，绝不能把头图/阅读背景当封面
  return imagesByRole(theme.value, '封面图库').map(a => a.url)
})
const heroCover = computed(() => coverImages.value[0] || '')
// 封面图库 meta 的 transparentOptimization：开启时封面是透明 PNG 贴纸样式，
// 去掉容器底色/圆角/阴影/裁剪，让贴纸自然融入背景
const isTransparentOpt = computed(() =>
  (theme.value?.galleries || []).some(g => g?.transparentOptimization === true)
)
// 主卡片占第一张封面，其余封面最多展示 6 个，超出部分随机抽取
const galleryCovers = computed(() => {
  const rest = coverImages.value.slice(1)
  if (rest.length <= 6) return rest
  const arr = [...rest]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, 6)
})


// 书架轮播图：日夜间可能绑定完全不同的图，优先取当前模式配置引用的哈希
const carouselImages = computed(() => {
  if (!theme.value) return []
  const refs = cfg.value.bookshelfCarouselImageUrls
  if (Array.isArray(refs) && refs.length) {
    const urls = refs.map(h => imageForHash(theme.value, h)).filter(Boolean)
    if (urls.length) return urls
  }
  return imagesByRole(theme.value, '书架轮播图').map(a => a.url)
})
const carouselIndex = ref(0)
let carouselTimer = null
function startCarousel() {
  stopCarousel()
  if (carouselImages.value.length <= 1) return
  carouselTimer = setInterval(() => {
    carouselIndex.value = (carouselIndex.value + 1) % carouselImages.value.length
  }, 3200)
}
function stopCarousel() {
  if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null }
}
// 主题或轮播图变化时重置
watch([() => theme.value?.uid, carouselImages], () => {
  carouselIndex.value = 0
  startCarousel()
}, { immediate: true })
onMounted(startCarousel)
onBeforeUnmount(stopCarousel)

const shelfBooks = computed(() => {
  const samples = [
    { title: '山茶文具店', tags: '#治愈 #日常 #日本文学', author: '小川糸', desc: '在镰仓，有一家帮人代笔的文具店，每代店主均由女性担任…', progress: 68 }
  ]
  return samples.map(s => ({ ...s, cover: heroCover.value || '' }))
})
// 底栏图标：按当前模式取（日夜可能各一套），公共底板已剔除
const navIconSet = computed(() => navIconsForMode(theme.value, state.mode))
const navLabels = ['书架', '书城', '发现', '我的']
// 底栏图标位：多图按顺序映射；整包只有一张图（如 matchMode=byType 的单图包）时复用到每个 tab。
// 每项为 { url, mono } 或 null（无图标，用圆点占位）
const navSlots = computed(() =>
  navLabels.map((_, i) => {
    const set = navIconSet.value
    if (!set.length) return null
    return set[i] || set[set.length - 1]
  })
)
// 单色 SVG 图标（App 运行时按主题色染色显示）：背景色刷强调色，再用 SVG 作 CSS mask，
// 夜间纯黑图标也能可见；普通位图保持原来的 background-image
function navIconStyle(slot) {
  if (!slot) return { background: accentColor.value }
  if (slot.mono) {
    const mask = `url(${slot.url})`
    return {
      backgroundColor: accentColor.value,
      backgroundImage: 'none',
      WebkitMaskImage: mask,
      maskImage: mask
    }
  }
  return { backgroundImage: `url(${slot.url})` }
}

/* ---------- 启动页 ---------- */
// 日间/夜间可能绑定不同的启动页配置（app.light/dark.customSplashId 引用不同的启动页）。
// 关联优先级：customSplashId 精确匹配（ZIP 包路径含 id）→ 配置名 日/夜 启发 → 第一个。
const splashEntry = computed(() => {
  const list = theme.value?.splashes || []
  if (!list.length) return null
  const splashId = cfg.value.customSplashId
  if (splashId) {
    const byId = list.find(s => s.splashId === splashId)
    if (byId) return byId
    const wantDark = state.mode === 'dark'
    const byName = list.find(s => {
      const n = String(s.data?.name || '')
      return wantDark ? /夜|night|dark/i.test(n) : /日|day|light/i.test(n)
    })
    if (byName) return byName
  }
  return list[0]
})
const splashConfig = computed(() => splashEntry.value?.data || theme.value?.splash || null)
const splashImage = computed(() => {
  const hash = splashEntry.value?.imageHash
  if (hash) {
    const url = imageForHash(theme.value, hash)
    if (url) return url
  }
  return imagesByRole(theme.value, '启动页')[0]?.url || ''
})

const cardBgColor = computed(() => cfg.value.cardColor || cfg.value.cardBackgroundColor)

const cardStyle = computed(() => {
  // 卡片背景图可能自带框线装饰，cover 会裁掉边缘、border-image 切片参数因主题而异容易错乱，
  // 统一用 100% 100% 完整铺进卡片，同时去掉卡片圆角避免裁掉框线的角
  if (cardImage.value) {
    return {
      backgroundImage: `url(${cardImage.value})`,
      backgroundSize: '100% 100%',
      borderRadius: 0
    }
  }
  // 有书架头图时卡片半透明，让头图从卡片下方透出来；无头图时用不透明实色
  const alpha = shelfBg.value ? 0.78 : 1
  return { background: rgba(cardBgColor.value, alpha, '#f4f4f2') }
})

const screenStyle = computed(() => {
  const style = {
    background: toHex(cfg.value.backgroundColor, '#ffffff')
  }
  if (shelfBg.value) {
    style.backgroundImage = `url(${shelfBg.value})`
    style.backgroundSize = 'cover'
    style.backgroundPosition = 'center'
  }
  return style
})

const screenTint = computed(() => {
  // 头图直接铺底，不叠加白色蒙层，保证头图清晰可见
  return 'transparent'
})

// 真实主题字段是 foregroundColor/mutedForegroundColor/cardForegroundColor 等
// （textColor 仅为兼容保留）；accentColor 缺失时回退 primaryColor
const inkColor = computed(() => toHex(cfg.value.foregroundColor || cfg.value.textColor, state.mode === 'dark' ? '#e9efee' : '#1b2422'))
// 次级文字（标签/作者/简介/未选中 tab）：主题给了就用，否则主文字降透明度
const mutedInkColor = computed(() =>
  cfg.value.mutedForegroundColor
    ? toHex(cfg.value.mutedForegroundColor, inkColor.value)
    : rgba(inkColor.value, 0.6)
)
// 卡片上的文字色（主题可单独指定卡片文字，与背景文字不同）
const cardTextColor = computed(() => toHex(cfg.value.cardForegroundColor, inkColor.value))
const cardMutedColor = computed(() =>
  cfg.value.mutedForegroundColor
    ? toHex(cfg.value.mutedForegroundColor, cardTextColor.value)
    : rgba(cardTextColor.value, 0.65)
)
const accentColor = computed(() => toHex(cfg.value.accentColor || cfg.value.primaryColor, '#0d9488'))
// 搜索框：主题可指定搜索框背景（常自带透明度）与输入框背景；文字用次级文字色
const searchStyle = computed(() => {
  const bg = cfg.value.searchFieldBackgroundColor || cfg.value.inputBackgroundColor
  const style = { color: mutedInkColor.value }
  if (bg) {
    style.background = rgba(bg, 1, 'rgba(255,255,255,.55)')
    style.backdropFilter = 'blur(10px)'
  }
  return style
})
// 分类 tab：选中=主文字，未选中=次级文字。
// 主题显式给了次级文字色时取消 CSS 的透明度（颜色本身已表达层级），否则保留 opacity 弱化
const explicitMuted = computed(() => Boolean(cfg.value.mutedForegroundColor))
const tabStyle = active => ({
  color: active ? inkColor.value : mutedInkColor.value,
  opacity: active || !explicitMuted.value ? undefined : 1
})
// 卡片内次级信息（标签/作者/简介）同理
const cardMutedStyle = computed(() => ({
  color: cardMutedColor.value,
  opacity: explicitMuted.value ? 1 : undefined
}))

/* ---------- 阅读页数据 ---------- */
const readerBg = computed(() => {
  if (!reader.value) return ''
  return imageForHash(theme.value, reader.value.backgroundImageUrl) || imagesByRole(theme.value, '阅读背景')[0]?.url || ''
})
const readerStyle = computed(() => ({
  background: toHex(reader.value?.backgroundColor, '#faf7f1'),
  backgroundImage: readerBg.value ? `url(${readerBg.value})` : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}))
const readerTextColor = computed(() => toHex(reader.value?.textColor, '#2b2b2b'))
// 阅读主题强调色：高亮规则 styleColorType=accent 时跟随此色
const readerPrimary = computed(() => toHex(reader.value?.primaryColor, accentColor.value))
const bodyStyle = computed(() => ({
  color: readerTextColor.value,
  fontSize: `${typo.value.fontSize}px`,
  lineHeight: typo.value.lineHeight,
  // 正文整体下移：固定 120px 顶距
  padding: `120px ${typo.value.paddingX}px 20px`,
  '--pgap': `${typo.value.paragraphGap}px`,
  textAlign: typo.value.align
}))

// 当前模式专属的高亮规则（日/夜可能各有一套对话/首字图案，颜色不同）
const modeRules = computed(() => rulesForMode(theme.value?.highlightRules || [], state.mode))

function highlighted(text) {
  return renderHighlighted(
    text,
    modeRules.value,
    readerTextColor.value,
    readerPrimary.value,
    theme.value
  )
}

const chapterTitle = '第一章 雨停之后'
const titleStyle = computed(() =>
  titleRuleStyle(modeRules.value, readerPrimary.value, theme.value)
)
// 无标题类高亮规则时，章节标题用阅读强调色着色 + 左侧色条，让强调色在预览中可见
const titleBarStyle = computed(() => {
  if (titleStyle.value) return titleStyle.value
  return {
    color: readerPrimary.value,
    borderLeft: `4px solid ${readerPrimary.value}`,
    paddingLeft: '10px'
  }
})

// 页眉/页脚（解析阅读配置绑定的状态项与自定义模板）
const statusBars = computed(() => readerStatusBars(reader.value))
const hasHeader = computed(() => Object.values(statusBars.value.header).some(Boolean))
const hasFooter = computed(() => Object.values(statusBars.value.footer).some(Boolean))
const headerBarStyle = computed(() => ({
  fontSize: `${statusBars.value.headerFontSize}px`,
  color: readerTextColor.value,
  paddingLeft: `${typo.value.paddingX}px`,
  paddingRight: `${typo.value.paddingX}px`
}))
const footerBarStyle = computed(() => ({
  fontSize: `${statusBars.value.footerFontSize}px`,
  color: readerTextColor.value,
  paddingLeft: `${typo.value.paddingX}px`,
  paddingRight: `${typo.value.paddingX}px`
}))

const pagerIndex = computed(() => {
  const list = state.visibleThemes
  const i = list.findIndex(t => t.uid === state.activeUid)
  return { pos: i < 0 ? 0 : i + 1, total: list.length }
})
</script>

<template>
  <section class="stage-column">
    <div class="stage-toolbar">
      <div class="pager">
        <button :disabled="pagerIndex.pos <= 1" @click="shiftActive(-1)">‹</button>
        <span class="pos">{{ pagerIndex.pos }} / {{ pagerIndex.total }}</span>
        <button :disabled="pagerIndex.pos >= pagerIndex.total || pagerIndex.total === 0" @click="shiftActive(1)">›</button>
      </div>

      <div class="seg">
        <button v-if="!isResourceOnly" :class="{ active: state.page === 'shelf' }" @click="state.page = 'shelf'">书架</button>
        <button v-if="!isResourceOnly" :class="{ active: state.page === 'splash' }" @click="state.page = 'splash'">启动页</button>
        <button :class="{ active: state.page === 'reader' }" @click="state.page = 'reader'">阅读页</button>
      </div>

      <div style="display:flex;gap:10px;align-items:center">
        <div class="seg">
          <button :class="{ active: state.mode === 'light' }" @click="state.mode = 'light'">日间</button>
          <button :class="{ active: state.mode === 'dark' }" :disabled="!availableModes.includes('dark')" @click="state.mode = 'dark'">夜间</button>
        </div>
        <button class="btn btn-sm" @click="shuffleText">换一段文字</button>
      </div>
    </div>

    <div class="stage">
      <div v-if="!theme" class="stage-empty">
        <span class="big">▣</span>
        <div>导入应用主题后，这里会出现手机预览</div>
      </div>

      <div v-else-if="theme.encrypted" class="stage-empty">
        <span class="big">🔒</span>
        <div style="margin-bottom:6px">这是一个 Reeden 私有加密的{{ theme.resourceKind || '资源' }}包</div>
        <div style="font-size:12px">已存档原始文件（可导出/同步），内容被 AES-256-GCM 加密，无法预览</div>
      </div>

      <div v-else class="phone-wrap">
        <div class="phone">
          <div class="phone-screen">
            <div class="screen-bg" :style="[screenStyle, { '--screen-tint': screenTint }]" />

            <!-- 状态栏 -->
            <div class="phone-status" :style="{ color: inkColor }">
              <span>9:41</span>
              <span class="sys">
                <span style="display:inline-flex;gap:2px;align-items:flex-end">
                  <i style="width:3px;height:5px;background:currentColor;border-radius:1px" />
                  <i style="width:3px;height:8px;background:currentColor;border-radius:1px" />
                  <i style="width:3px;height:11px;background:currentColor;border-radius:1px" />
                </span>
                <span style="border:1.4px solid currentColor;border-radius:3px;width:20px;height:10px;position:relative;opacity:.9" />
              </span>
            </div>

            <!-- 书架 -->
            <div
              v-if="state.page === 'shelf' && !isResourceOnly"
              class="shelf"
              :class="{ 'no-shelf-bg': !shelfBg }"
              :style="{ color: inkColor }"
            >
              <div class="shelf-top">
                <div class="shelf-title-row">
                  <span class="shelf-title">书架 <i class="caret">▾</i></span>
                  <div class="shelf-icons">
                    <span class="sic">☻</span>
                    <span class="sic">☾</span>
                    <span class="sic">⬇</span>
                    <span class="sic">⋯</span>
                  </div>
                </div>
                <div class="shelf-tabs">
                  <span class="tab active" :style="tabStyle(true)">全部</span>
                  <span class="tab" :style="tabStyle(false)">想放弃</span>
                  <span class="tab" :style="tabStyle(false)">预览专用</span>
                  <span class="tab" :style="tabStyle(false)">正在读</span>
                  <span class="tab" :style="tabStyle(false)">已读</span>
                  <i class="caret">▾</i>
                </div>
              </div>

              <div class="shelf-search" :style="searchStyle">⌕&nbsp;&nbsp;搜索 113 本书</div>

              <div v-if="carouselImages.length" class="shelf-carousel">
                <div class="carousel-track" :style="{ transform: `translateX(-${carouselIndex * 100}%)` }">
                  <div
                    v-for="(url, i) in carouselImages"
                    :key="i"
                    class="carousel-slide"
                    :style="{ backgroundImage: `url(${url})` }"
                  />
                </div>
                <div v-if="carouselImages.length > 1" class="carousel-dots">
                  <span
                    v-for="(_, i) in carouselImages"
                    :key="i"
                    class="dot"
                    :class="{ active: i === carouselIndex }"
                    @click="carouselIndex = i"
                  />
                </div>
              </div>

              <div class="book-list">
                <div
                  v-for="(book, i) in shelfBooks"
                  :key="i"
                  class="book-card"
                  :style="cardStyle"
                >
                  <div
                    class="bcover"
                    :class="{ 'has-cover': !!book.cover, 'transparent-opt': isTransparentOpt }"
                    :style="book.cover
                      ? { backgroundImage: `url(${book.cover})` }
                      : { backgroundColor: '#cdd6d2' }"
                  >
                    <span v-if="!book.cover" class="bcover-ph">绿</span>
                  </div>
                  <div class="binfo">
                    <div class="btitle" :style="{ color: cardTextColor }">{{ book.title }}</div>
                    <div class="btags" :style="cardMutedStyle">{{ book.tags }}</div>
                    <div class="bauthor" :style="cardMutedStyle">{{ book.author }}</div>
                    <div class="bdesc" :style="cardMutedStyle">{{ book.desc }}</div>
                    <div class="bfoot">
                      <span class="bprogress" :style="{ color: cardTextColor }">{{ book.progress }}%</span>
                      <span class="bmore">⋯</span>
                    </div>
                  </div>
                </div>

                <!-- 其余封面图库展示：紧贴卡片下方，最多 6 个，超出随机 -->
                <div v-if="galleryCovers.length" class="cover-gallery-row">
                  <div
                    v-for="(url, i) in galleryCovers"
                    :key="i"
                    class="cg-item"
                    :class="{ 'transparent-opt': isTransparentOpt }"
                    :style="{ backgroundImage: `url(${url})` }"
                    :title="`封面 ${i + 2}`"
                  />
                </div>
              </div>

              <div class="phone-navbar" :style="{ background: rgba(cardBgColor, 0.55, '#ffffff99') }">
                <div
                  v-for="(label, i) in navLabels"
                  :key="label"
                  class="nav-item"
                  :class="{ active: i === 0 }"
                >
                  <span
                    class="nav-ic"
                    :class="{ 'dot-ic': !navSlots[i], 'mask-ic': navSlots[i]?.mono }"
                    :style="navIconStyle(navSlots[i])"
                  />
                  {{ label }}
                </div>
              </div>
            </div>

            <!-- 启动页 -->
            <div v-else-if="state.page === 'splash' && !isResourceOnly" class="splash">
              <div
                v-if="splashImage"
                class="splash-bg"
                :style="{ backgroundImage: `url(${splashImage})` }"
              />
              <div v-else class="splash-empty">
                <span class="big">✦</span>
                <div>该主题未配置启动页图片</div>
              </div>
              <div class="splash-skip" v-if="splashImage">
                <span>跳过</span>
                <span class="splash-tip" v-if="splashConfig?.fixedDurationMs">
                  {{ Math.round(splashConfig.fixedDurationMs / 100) / 10 }}s
                </span>
              </div>
            </div>

            <!-- 阅读页 -->
            <div v-else class="reader" :style="readerStyle">
              <div v-if="hasHeader" class="reader-status reader-status-header" :style="headerBarStyle">
                <span class="rs-left">{{ statusBars.header.left || '' }}</span>
                <span class="rs-center">{{ statusBars.header.center || '' }}</span>
                <span class="rs-right">{{ statusBars.header.right || '' }}</span>
              </div>
              <div class="reader-body" :style="bodyStyle">
                <h4 class="chapter-title" :style="titleBarStyle">{{ chapterTitle }}</h4>
                <p v-for="(p, i) in paragraphs" :key="`${textSeed}-${i}`" v-html="highlighted(p)" />
              </div>
              <div v-if="hasFooter" class="reader-status reader-status-footer" :style="footerBarStyle">
                <span class="rs-left">{{ statusBars.footer.left || '' }}</span>
                <span class="rs-center">{{ statusBars.footer.center || '' }}</span>
                <span class="rs-right">{{ statusBars.footer.right || '' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
