// 主题语义分析：识别应用配置 / 阅读配色 / 封面图库 / 底栏 / 高亮规则，
// 并把"配置中的图片哈希引用"与包内图片对应起来标注角色
import { md5 } from './md5.js'
import { sniff, imageSize } from './media.js'

const HASH_32 = /^[0-9A-F]{32}$/i
const RULE_KEY_PATTERN = /regex|pattern|keyword|matchText|expression/i
const RULE_KEY_STYLE = /style|color|fontWeight|decoration|opacity|css/i

let patternSeq = 0

/** 解码高亮规则内嵌图案：base64 → gzip 解压 → 图片字节 */
async function decodeRuleImage(b64) {
  if (typeof b64 !== 'string' || !b64 || typeof DecompressionStream === 'undefined') return null
  try {
    const bin = atob(b64)
    const packed = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) packed[i] = bin.charCodeAt(i)
    const stream = new Blob([packed])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'))
    return new Uint8Array(await new Response(stream).arrayBuffer())
  } catch {
    return null
  }
}

/** 递归收集高亮规则（同时具备匹配条件与样式描述的对象） */
export function extractRules(data) {
  const found = []
  const visit = node => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    const keys = Object.keys(node)
    const displayName = String(node.name || node.title || node.preset || '')
    const looksPattern =
      keys.some(k => RULE_KEY_PATTERN.test(k)) ||
      /对话|括号|dialogue|bracket/i.test(displayName)
    const looksStyle = keys.some(k => RULE_KEY_STYLE.test(k))
    if (looksPattern && looksStyle) {
      found.push(node)
    } else {
      for (const value of Object.values(node)) visit(value)
    }
  }
  visit(data)
  return found
}

/** 遍历对象，收集所有"值是 32 位哈希"的字段路径 */
function collectHashRefs(root) {
  const refs = []
  const walk = (node, path) => {
    if (!node || typeof node !== 'object') return
    for (const [key, value] of Object.entries(node)) {
      const nextPath = path ? `${path}.${key}` : key
      if (typeof value === 'string' && HASH_32.test(value)) {
        refs.push({ hash: value.toUpperCase(), path: nextPath })
      } else if (value && typeof value === 'object') {
        walk(value, nextPath)
      }
    }
  }
  walk(root, '')
  return refs
}

function roleByPath(fieldPath) {
  if (/backgroundImageUrl/i.test(fieldPath)) return '阅读背景'
  if (/bookshelfCarouselImage/i.test(fieldPath)) return '书架轮播图'
  if (/cardBackgroundImage/i.test(fieldPath)) return '书架卡片图'
  if (/splash/i.test(fieldPath)) return '启动页'
  if (/backgroundImage/i.test(fieldPath)) return '书架背景'
  return null
}

function roleByAssetPath(assetPath) {
  if (/cover_gallery\//i.test(assetPath)) return '封面图库'
  if (/navbar_pack\//i.test(assetPath)) return '底栏图标'
  if (/reader_schema\/.*\/bg\./i.test(assetPath)) return '阅读背景'
  if (/(^|\/)theme_bg\./i.test(assetPath)) return '书架背景'
  if (/bookshelf_carousel\//i.test(assetPath)) return '书架轮播图'
  if (/splash/i.test(assetPath)) return '启动页'
  return null
}

function safeJsonMaybe(value) {
  if (typeof value !== 'string') return value && typeof value === 'object' ? value : null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

/** layoutConfig 在部分主题里是 JSON 字符串，统一成对象 */
export function normalizeLayout(reader) {
  return safeJsonMaybe(reader?.layoutConfig) || {}
}

/**
 * 将解析出的原始资源整理为主题模型
 */
export async function analyzeTheme({ fileName, size, header, assets, warnings }) {
  const jsonAssets = assets.filter(a => a.type === 'json' && a.data)
  const imageAssets = assets.filter(a => a.type === 'image')
  const imageByHash = new Map(imageAssets.map(a => [a.hash, a]))

  const appAsset = jsonAssets.find(a => a.data.light && a.data.dark)
  const readerAssets = jsonAssets.filter(a => a.data.backgroundColor && a.data.layoutConfig)
  const galleryAssets = jsonAssets.filter(
    a =>
      Object.prototype.hasOwnProperty.call(a.data, 'transparentOptimization') ||
      /cover_gallery\/.*meta\.json$/i.test(a.path || '')
  )
  // 底栏图标包配置：一个主题可能含多套（日间/夜间各一个 byType meta）
  const navbarMetas = jsonAssets.filter(
    a =>
      (Object.keys(a.data || {}).length === 1 && a.data?.name) ||
      (a.data?.name && a.data.matchMode) ||
      /navbar_pack\/.*meta\.json$/i.test(a.path || '')
  )
  const navbarAsset = navbarMetas[0] || null
  // 启动页配置：含停留时长/退出策略等典型字段
  const splashAssets = jsonAssets.filter(
    a =>
      Object.prototype.hasOwnProperty.call(a.data, 'fixedDurationMs') ||
      Object.prototype.hasOwnProperty.call(a.data, 'exitStrategy') ||
      /splash/i.test(a.path || '')
  )
  // 书架轮播图配置（ZIP 目录约定：bookshelf_carousel/manifest.json）
  const carouselAssets = jsonAssets.filter(a =>
    /bookshelf_carousel\/.*(manifest|meta)\.json$/i.test(a.path || '')
  )

  // 高亮规则：合并所有 JSON 中发现的规则，按"模式 + name + regex"去重。
  // 日/夜 reader 可能各自带一套同名同正则、但样式与图案不同的规则（如对话气泡日绿夜紫、
  // 首字图案颜色不同），绝不能跨模式合并
  const seenRule = new Set()
  const highlightRules = []
  jsonAssets.forEach(asset => {
    let mode = asset.data?.themeMode || null
    if (!mode && readerAssets.includes(asset) && readerAssets.length >= 2) {
      // 与 theme-ui.readerConfig 的回退约定一致：首个 reader 日间，末个 reader 夜间
      mode = readerAssets.indexOf(asset) === 0 ? 'light' : 'dark'
    }
    for (const rule of extractRules(asset.data)) {
      const key = `${mode || 'shared'}|${rule.name || ''}|${rule.regex || rule.pattern || rule.matchText || ''}`
      if (!seenRule.has(key)) {
        seenRule.add(key)
        if (mode) rule._mode = mode
        highlightRules.push(rule)
      }
    }
  })

  // 1) 配置中直接引用图片哈希 —— 可信度最高
  // 注意：封面图库 meta 自身也会列出封面哈希，不能算作"已被引用"，
  // 否则顺序包的封面邻居推断会失效，因此遍历引用时跳过 gallery 配置
  const referencedHashes = new Set()
  for (const asset of jsonAssets) {
    if (galleryAssets.includes(asset)) continue
    for (const ref of collectHashRefs(asset.data)) {
      const target = imageByHash.get(ref.hash)
      if (!target) continue
      referencedHashes.add(ref.hash)
      const role = roleByPath(ref.path)
      if (role && target.role === '未分类') {
        target.role = role
        target.confidence = 'direct'
      }
    }
  }

  // 2) ZIP 路径直接表明用途
  for (const asset of imageAssets) {
    if (!asset.path) continue
    const role = roleByAssetPath(asset.path)
    if (role && asset.role === '未分类') {
      asset.role = role
      asset.confidence = 'path'
    }
  }

  // 2.5) 顺序拼接包：封面图库 meta 前面紧邻的、未被配置直接引用的连续图片即封面
  // （向前扫描直到遇到非图片、已分类图片或被配置引用的图片）
  for (const gallery of galleryAssets) {
    if (gallery.path) continue
    let i = assets.indexOf(gallery) - 1
    const coverRun = []
    while (i >= 0 && assets[i].type === 'image'
      && assets[i].role === '未分类'
      && !referencedHashes.has(assets[i].hash)) {
      coverRun.unshift(assets[i])
      i--
    }
    for (const image of coverRun) {
      image.role = '封面图库'
      image.confidence = 'inferred'
    }
  }

  // 2.6) 顺序拼接包：启动页 meta 前面紧邻的一张图片即启动页
  for (const splashMeta of splashAssets) {
    if (splashMeta.path) continue
    const i = assets.indexOf(splashMeta) - 1
    const image = assets[i]
    if (image?.type === 'image'
      && image.role === '未分类'
      && !referencedHashes.has(image.hash)) {
      image.role = '启动页'
      image.confidence = 'inferred'
      // 记录配置↔图片配对，供日间/夜间各自取自己的启动页
      splashMeta._imageHash = image.hash
    }
  }

  // 2.7) 顺序拼接包：底栏图标包 meta（{name, matchMode} 等）前后紧邻的
  // 连续方形图片（宽高比≈1）即底栏图标。一个主题可能有多套（日间/夜间），
  // 每套 meta 各自向前后扫描；相邻 meta 之间被双方扫到的图片，归距离更近的 meta。
  // 被其他配置引用的图片作为扫描边界（头图/阅读背景不会被抢成图标）。
  const sequentialNavMetas = navbarMetas.filter(m => !m.path)
  if (sequentialNavMetas.length) {
    const nearlySquare = image => {
      if (!image.width || !image.height) return true // 读不到尺寸时不阻止
      const ratio = Math.abs(image.width - image.height) / Math.max(image.width, image.height)
      return ratio < 0.35 // 放宽阈值，允许短剧 App 的矩形 tab 图标（如 256×171，差 33%）
    }
    const eligible = image =>
      image.type === 'image'
      && image.role === '未分类'
      && !referencedHashes.has(image.hash)
      && nearlySquare(image)

    // meta 出现顺序 → 模式：双 pack（日夜各一个 navbarPackId）时第一套日、第二套夜；
    // 单套时按 app 里唯一存在的 packId 归属，缺省日间
    const appData = appAsset?.data
    const dualPack = !!(appData?.light?.navbarPackId && appData?.dark?.navbarPackId)
    sequentialNavMetas.forEach((meta, order) => {
      let mode = null
      if (sequentialNavMetas.length >= 2 && dualPack) {
        mode = order === 0 ? 'light' : 'dark'
      } else if (sequentialNavMetas.length === 1) {
        mode = appData?.dark?.navbarPackId && !appData?.light?.navbarPackId ? 'dark' : 'light'
      }
      meta._navMode = mode
    })

    // 每张候选图 -> 最近的 meta 及其距离
    const claims = new Map()
    for (const meta of sequentialNavMetas) {
      const mi = assets.indexOf(meta)
      let d = 0
      for (let i = mi - 1; i >= 0 && d < 12; i--) {
        if (!eligible(assets[i])) break
        d++
        const cur = claims.get(assets[i])
        if (!cur || d < cur.dist) claims.set(assets[i], { meta, dist: d })
      }
      d = 0
      for (let i = mi + 1; i < assets.length && d < 12; i++) {
        if (!eligible(assets[i])) break
        d++
        const cur = claims.get(assets[i])
        if (!cur || d < cur.dist) claims.set(assets[i], { meta, dist: d })
      }
    }
    for (const [image, claim] of claims) {
      image.role = '底栏图标'
      image.confidence = 'inferred'
      if (claim.meta._navMode) image._navMode = claim.meta._navMode
    }
  }

  // 3) 配置 JSON 自身角色
  if (appAsset) appAsset.role = '应用主题配置'
  for (const a of readerAssets) a.role = '阅读配置'
  for (const a of galleryAssets) a.role = '封面图库配置'
  if (navbarAsset) navbarAsset.role = '底栏配置'
  for (const a of splashAssets) a.role = '启动页配置'
  for (const a of carouselAssets) a.role = '书架轮播图配置'
  for (const a of jsonAssets) {
    if (extractRules(a.data).length && !readerAssets.includes(a) && a !== appAsset) {
      a.role = '高亮规则'
    }
  }

  // 4) 高亮规则绑定的图案
  //    两种来源：backgroundImageData（gzip+base64 内嵌 PNG）或 CSS 中 url("哈希") 引用包内图片
  for (const rule of highlightRules) {
    const cssText = String(rule.styleCssText || rule.style?.cssText || '')
    const urlHash = cssText.match(/url\(\s*['"]?([0-9A-F]{32})['"]?\s*\)/i)
    let imageBytes = null
    if (rule.backgroundImageData) {
      imageBytes = await decodeRuleImage(rule.backgroundImageData)
    }
    if (imageBytes) {
      const hit = sniff(imageBytes, 0)
      if (hit?.kind === 'image') {
        const hash = md5(imageBytes)
        rule._patternHash = hash
        if (!imageByHash.has(hash)) {
          const ext = hit.mime.split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg')
          const safeName = String(rule.name || 'pattern').replace(/[\\/:*?"<>|]/g, '_').slice(0, 40)
          const blob = new Blob([imageBytes], { type: hit.mime })
          const asset = {
            id: `hp${++patternSeq}`,
            type: 'image',
            mime: hit.mime,
            path: `highlight_rule/${safeName}.${ext}`,
            size: imageBytes.length,
            hash,
            url: URL.createObjectURL(blob),
            width: 0,
            height: 0,
            data: null,
            role: '高亮图案',
            confidence: 'embedded',
            ruleName: rule.name || ''
          }
          try {
            Object.assign(asset, await imageSize(blob))
          } catch {
            /* 尺寸读取失败不影响使用 */
          }
          assets.push(asset)
          imageByHash.set(hash, asset)
        }
      }
    } else if (urlHash) {
      rule._patternHash = urlHash[1].toUpperCase()
    }
  }

  const title =
    appAsset?.data?.name ||
    readerAssets[0]?.data?.name ||
    jsonAssets.find(a => a.data?.name)?.data.name ||
    fileName.replace(/\.red$/i, '')

  // 资源包分类（无应用配置时按内容归类）
  const haystack = [
    header.resourceType,
    header.resourceKind,
    fileName,
    ...jsonAssets.map(a => `${a.path || ''} ${Object.keys(a.data).join(' ')}`)
  ]
    .join(' ')
    .toLowerCase()

  let resourceKind = ''
  if (!appAsset) {
    resourceKind =
      highlightRules.length || /高亮|highlight/.test(haystack)
        ? '高亮规则'
        : /标题|title.?style|chapter.?title|heading/.test(haystack)
          ? '标题样式'
          : readerAssets.length || /内页|reader|pagination/.test(haystack)
            ? '内页样式'
            : '独立配置'
  }

  return {
    fileName,
    size,
    title,
    header,
    warnings,
    isResourceOnly: !appAsset,
    resourceKind,
    app: appAsset?.data || null,
    readers: readerAssets.map(a => a.data),
    galleries: galleryAssets.map(a => a.data),
    navbar: navbarAsset?.data || null,
    splash: splashAssets[0]?.data || null,
    // 全部启动页配置：日间/夜间可能绑定不同启动页。
    // splashId 来自 ZIP 路径 custom_splash/<id>/；imageHash 是配置配对的启动图（顺序包按位置推断，ZIP 按同 id 目录）
    splashes: splashAssets.map(a => {
      const path = a.path || ''
      const idMatch = path.match(/custom_splash\/([^/]+)/i)
      const splashId = idMatch ? idMatch[1] : null
      let imageHash = a._imageHash || null
      if (!imageHash && splashId) {
        const img = imageAssets.find(x => x.path && x.path.includes(splashId))
        imageHash = img?.hash || null
      }
      return { data: a.data, path, splashId, imageHash }
    }),
    highlightRules,
    assets,
    imageByHash
  }
}
