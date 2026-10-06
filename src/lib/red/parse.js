// RED 主题容器解析主入口
// 容器形态：
//   1) "RED" + 0x00 + u32be(头长度) + JSON 头 + 清单区 + 顺序拼接资源（plain-sequential）
//   2) "RED" + 0x04 + ZIP(本地文件头 PK\x03\x04) —— REDv4 变体
import { matches, u32be, utf8 } from './binary.js'
import { md5 } from './md5.js'
import { sniff, nextResource, imageSize, hexPreview, classifyMagic, isMonochromeSvg } from './media.js'
import { unzip } from './zip.js'

const MIME_BY_EXT = [
  [/\.png$/i, 'image/png'],
  [/\.jpe?g$/i, 'image/jpeg'],
  [/\.gif$/i, 'image/gif'],
  [/\.webp$/i, 'image/webp'],
  [/\.svg$/i, 'image/svg+xml']
]

let assetSeq = 0

async function makeAsset(bytes, mime, type, path = '', shouldCancel) {
  const hash = md5(bytes)
  const blob = new Blob([bytes], { type: mime })
  const asset = {
    id: `a${++assetSeq}`,
    type,
    mime,
    path,
    size: bytes.length,
    hash,
    url: URL.createObjectURL(blob),
    width: 0,
    height: 0,
    data: null,
    role: '未分类',
    confidence: 'unknown'
  }
  if (type === 'image') {
    const sizeInfo = await imageSize(blob)
    Object.assign(asset, sizeInfo)
    // 单色 SVG 图标（如 26个字母的纯黑图标）标记出来，预览用 CSS mask 染主题色
    if (mime === 'image/svg+xml') asset.mono = isMonochromeSvg(bytes)
    if (shouldCancel?.()) throw makeCancel()
  } else {
    try {
      asset.data = JSON.parse(utf8(bytes))
    } catch {
      asset.data = null
    }
  }
  return asset
}

function makeCancel() {
  const err = new Error('已取消解析')
  err.cancelled = true
  return err
}

/** 解析顺序拼接资源区 */
async function scanSequential(buf, start, shouldCancel) {
  const assets = []
  let p = start
  let skipped = 0
  let guard = 0
  const skippedSegments = []

  while (p < buf.length && guard++ < 5000) {
    if (shouldCancel?.()) throw makeCancel()
    const hit = sniff(buf, p)
    if (!hit) {
      const next = nextResource(buf, p)
      const segEnd = next < 0 ? buf.length : next
      // 纯空白（换行/制表/空格）是资源间分隔或对齐填充，不算无法识别的数据
      let whitespace = true
      for (let i = p; i < segEnd; i++) {
        if (buf[i] > 0x20) { whitespace = false; break }
      }
      if (!whitespace) {
        skippedSegments.push({ offset: p, length: segEnd - p })
        skipped += segEnd - p
      }
      if (next < 0) break
      p = next
      continue
    }
    const end = hit.endAt(buf, p)
    const bytes = buf.subarray(p, end)
    const asset = await makeAsset(
      bytes,
      hit.mime,
      hit.kind,
      '',
      shouldCancel
    )
    assets.push(asset)
    p = end
  }
  return { assets, skipped, skippedSegments }
}

/** 解析 ZIP 变体：按文件扩展名确定类型，无扩展名（.img）时按内容嗅探，JSON 直接解析 */
async function scanZip(buf, zipOffset, shouldCancel) {
  const files = await unzip(buf, zipOffset)
  const assets = []
  for (const file of files) {
    if (shouldCancel?.()) throw makeCancel()
    const mimeEntry = MIME_BY_EXT.find(([re]) => re.test(file.path))
    if (mimeEntry) {
      assets.push(await makeAsset(file.bytes, mimeEntry[1], 'image', file.path, shouldCancel))
    } else if (/\.json$/i.test(file.path)) {
      assets.push(await makeAsset(file.bytes, 'application/json', 'json', file.path, shouldCancel))
    } else {
      // .img 等无类型扩展名：按文件头嗅探实际图片格式
      const hit = sniff(file.bytes, 0)
      if (hit?.kind === 'image') {
        assets.push(await makeAsset(file.bytes, hit.mime, 'image', file.path, shouldCancel))
      }
    }
  }
  return { assets, skipped: 0 }
}

/** 解析 v1 阅读主题：RED\x01 + gzip(单个 JSON)，type=readerColorSchema。
 * 每个配色方案一个 JSON 资产；内嵌背景图是 base64(gzip(图片))，解码为图片资产 */
async function scanGzipJson(buf, shouldCancel) {
  const gunzip = async b =>
    new Uint8Array(await new Response(
      new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))
    ).arrayBuffer())
  const plain = await gunzip(buf)
  const root = JSON.parse(utf8(plain))
  if (root.type !== 'readerColorSchema' || !Array.isArray(root.data)) {
    throw new Error(`暂不支持的 v1 主题类型：${root.type || '未知'}`)
  }
  const assets = []
  const encoder = new TextEncoder()
  for (const schema of root.data) {
    if (shouldCancel?.()) throw makeCancel()
    if (typeof schema.backgroundImageData === 'string' && schema.backgroundImageData) {
      try {
        const packed = Uint8Array.from(atob(schema.backgroundImageData), c => c.charCodeAt(0))
        const imgBytes = await gunzip(packed)
        const hit = sniff(imgBytes, 0)
        if (hit?.kind === 'image') {
          assets.push(await makeAsset(imgBytes, hit.mime, 'image', '', shouldCancel))
        }
      } catch { /* 背景图损坏不阻断主题导入 */ }
    }
    assets.push(await makeAsset(encoder.encode(JSON.stringify(schema)), 'application/json', 'json', '', shouldCancel))
  }
  return { assets, skipped: 0 }
}

/**
 * 解析一个 .red 文件
 * @returns {Promise<{header:object, assets:Array, warnings:string[]}>}
 */
export async function parseRedBytes(bytes, { shouldCancel, onProgress } = {}) {
  if (!matches(bytes, 0, 'RED')) throw new Error('不是 Reeden RED 文件（缺少 RED 标识）')

  let header
  let result

  if (bytes[3] === 0x01) {
    header = { version: 1, container: 'gzip-json' }
    onProgress?.('正在解压阅读主题…')
    result = await scanGzipJson(bytes.subarray(4), shouldCancel)
  } else if (bytes[3] === 0x10) {
    // Reeden 私有加密资源包（高亮规则/标题样式等）：除头部外全部为 AES-256-GCM 密文，
    // 密钥由 Reeden App 私有持有，无法解密 —— 不解析内容，作为"加密存档"入库保留原始文件
    let h = {}
    try {
      const headerLen = u32be(bytes, 4)
      h = JSON.parse(utf8(bytes.subarray(8, 8 + headerLen)))
    } catch { /* 头部不可读也按加密存档处理 */ }
    header = { ...h, version: h.version ?? 2, container: 'reedenPrivate' }
    return { header, assets: [], warnings: [], encrypted: true }
  } else if (bytes[3] === 0x04 && matches(bytes, 4, 'PK\x03\x04')) {
    header = { version: 4, container: 'zip' }
    onProgress?.('正在解压 ZIP 资源…')
    // RED\x04（4 字节）前缀之后才是 ZIP 数据，ZIP 内部偏移需加上该前缀
    result = await scanZip(bytes, 4, shouldCancel)
  } else {
    const headerLen = u32be(bytes, 4)
    if (headerLen < 20 || headerLen > 100_000 || 8 + headerLen > bytes.length) {
      throw new Error('RED 文件头长度异常')
    }
    try {
      header = JSON.parse(utf8(bytes.subarray(8, 8 + headerLen)))
    } catch {
      throw new Error('无法读取 RED 文件头 JSON')
    }
    if (header.version !== 2 || header.assetMode !== 'plain-sequential') {
      throw new Error(`暂不支持的容器版本：v${header.version ?? '?'} / ${header.assetMode ?? 'unknown'}`)
    }
    const payloadStart = 8 + headerLen + Number(header.manifestLength || 0)
    if (payloadStart >= bytes.length) throw new Error('资源区为空或文件已损坏')
    onProgress?.('正在扫描顺序资源…')
    result = await scanSequential(bytes, payloadStart, shouldCancel)
  }

  const warnings = []
  if (result.skipped > 0) {
    warnings.push(`有 ${result.skipped} 字节无法识别的数据已跳过`)
    // 诊断：列出每段跳过数据的位置、大小、文件头魔数与猜测类型
    for (const seg of result.skippedSegments || []) {
      const preview = hexPreview(bytes, seg.offset, 16)
      const kind = classifyMagic(bytes, seg.offset)
      warnings.push(
        `跳过片段 @${seg.offset}，${seg.length} 字节` +
        (kind ? `，疑似：${kind}` : '，类型未知（可能是填充/对齐字节）') +
        `\n文件头：${preview.hex} ｜ ASCII：${preview.ascii}`
      )
    }
  }
  if (!result.assets.some(a => a.type === 'json' && a.data)) {
    throw new Error('未找到可读取的主题配置 JSON')
  }
  return { header, assets: result.assets, warnings }
}
