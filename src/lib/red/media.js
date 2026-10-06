// 图片/JSON 资源边界扫描 —— 依据 PNG / JPEG / GIF / RIFF 公开文件结构
import { matches, u32be, u32le, utf8, SIG } from './binary.js'

/** PNG：按 chunk 行走，遇到 IEND 结束；返回结束偏移（exclusive） */
export function pngEnd(buf, start) {
  let p = start + 8
  while (p + 12 <= buf.length) {
    const len = u32be(buf, p)
    const type = utf8(buf.subarray(p + 4, p + 8))
    p += 12 + len
    if (type === 'IEND') return p
  }
  throw new Error('PNG 数据不完整')
}

/** JPEG：遍历 marker 段；SOS 之后扫描熵数据直到 FFD9 */
export function jpegEnd(buf, start) {
  let p = start + 2
  while (p < buf.length) {
    if (buf[p] !== 0xff) { p++; continue }
    // 跳过填充的连续 FF
    while (buf[p] === 0xff) p++
    const marker = buf[p++]
    if (marker === 0xd9) return p // EOI
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue // 无长度段
    if (p + 2 > buf.length) break
    const segLen = (buf[p] << 8) | buf[p + 1] // JPEG 段长度为大端，含自身 2 字节
    if (marker === 0xda) {
      // SOS：熵数据中 FF00 是转义字节，FFD0-D7 是重启标记，FFD9 是结束
      let q = p + segLen
      while (q < buf.length - 1) {
        if (buf[q] === 0xff) {
          const n = buf[q + 1]
          if (n === 0x00 || (n >= 0xd0 && n <= 0xd7)) { q += 2; continue }
          if (n === 0xd9) return q + 2
          break
        }
        q++
      }
      throw new Error('JPEG SOS 后未找到 EOI')
    }
    p += segLen
  }
  throw new Error('JPEG 数据不完整')
}

/** GIF：跳过逻辑屏幕描述符后遍历 block，trailer 0x3B 结束 */
function skipSubBlocks(buf, p) {
  while (p < buf.length) {
    const size = buf[p++]
    if (size === 0) return p
    p += size
  }
  throw new Error('GIF 子块不完整')
}

export function gifEnd(buf, start) {
  let p = start + 13
  const packed = buf[start + 10]
  if (packed & 0x80) p += 3 * (1 << ((packed & 0x07) + 1)) // 全局色表
  while (p < buf.length) {
    const label = buf[p++]
    if (label === 0x3b) return p // trailer
    if (label === 0x21) { // extension
      p++ // extension label
      const extLabel = buf[p - 1]
      if (extLabel === 0xf9) p += 5 // graphic control：块大小字节 + 4 字节，落在终止符上
      else if (extLabel === 0xff) p += 12 // application：块大小(0x0B) + 11 字节数据，之后是子块链
      p = skipSubBlocks(buf, p)
    } else if (label === 0x2c) { // image descriptor
      p += 8
      const ipacked = buf[p]
      p++
      if (ipacked & 0x80) p += 3 * (1 << ((ipacked & 0x07) + 1))
      p++ // LZW min code size
      p = skipSubBlocks(buf, p)
    } else {
      throw new Error('GIF 块类型异常')
    }
  }
  throw new Error('GIF 数据不完整')
}

/** WEBP：RIFF 容器总长 = 8 + chunkSize，奇数补 1 */
export function webpEnd(buf, start) {
  const size = u32le(buf, start + 4)
  const end = start + 8 + size + (size & 1)
  if (end > buf.length) throw new Error('WEBP 数据不完整')
  return end
}

/** 扫描一个 JSON 值（对象或数组），考虑字符串与转义，返回结束偏移 */
export function jsonEnd(buf, start) {
  const open = buf[start]
  const close = open === 0x7b ? 0x7d : 0x5d // { } 或 [ ]
  let depth = 0
  let inString = false
  let escaped = false
  for (let p = start; p < buf.length; p++) {
    const c = buf[p]
    if (inString) {
      if (escaped) escaped = false
      else if (c === 0x5c) escaped = true
      else if (c === 0x22) inString = false
      continue
    }
    if (c === 0x22) inString = true
    else if (c === open) depth++
    else if (c === close && --depth === 0) return p + 1
  }
  throw new Error('JSON 数据不完整')
}

/** SVG：定位结束标签 </svg>，返回结束偏移（exclusive）；找不到则抛错 */
export function svgEnd(buf, start) {
  const probe = 2048
  const head = utf8(buf.subarray(start, Math.min(buf.length, start + probe)))
  if (!/<svg[\s>]/i.test(head)) throw new Error('不是 SVG 数据')
  // 在全量缓冲中找闭合标签（图标通常不大，逐字节匹配即可）
  const close = [0x3c, 0x2f, 0x73, 0x76, 0x67, 0x3e] // </svg>
  const ci = (buf, i) => {
    if (i + 6 > buf.length) return false
    for (let k = 0; k < 6; k++) {
      const a = buf[i + k]
      const b = close[k]
      // 大小写不敏感匹配 s/g/v
      if (k >= 2 && k <= 4) {
        if (a !== b && a !== b - 32) return false
      } else if (a !== b) {
        return false
      }
    }
    return true
  }
  for (let p = start; p + 6 <= buf.length; p++) {
    if (ci(buf, p)) return p + 6
  }
  throw new Error('SVG 数据不完整')
}

// SVG 基本命名色中的灰度色（出现这些仍算单色图标）
const SVG_GRAY_NAMES = new Set([
  'black', 'white', 'gray', 'grey', 'silver', 'gainsboro',
  'lightgray', 'lightgrey', 'darkgray', 'darkgrey', 'dimgray', 'dimgrey',
  'whitesmoke', 'snow', 'ivory'
])

function hexRgb(token) {
  let h = token.slice(1)
  if (h.length === 3 || h.length === 4) h = h.split('').map(c => c + c).join('')
  if (h.length === 6 || h.length === 8) {
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  return null
}

/**
 * 判断 SVG 是否为单色（灰度）图标：所有显式颜色都是黑/白/灰、none 或 currentColor
 * 时返回 true（完全未指定颜色时默认填充也是黑色，同样算单色）。
 * 单色图标在预览里可用 CSS mask 按主题强调色染色；彩色 SVG（如京都雪的彩色底栏）
 * 必须保留原色，不能 mask。
 */
export function isMonochromeSvg(bytes) {
  let text
  try {
    text = new TextDecoder('utf-8').decode(bytes)
  } catch {
    return false
  }
  // 收集 fill / stroke / stop-color / color 的取值（属性与 CSS 两种写法）。
  // token 允许内含空格（rgb(0, 0, 0)），在引号/分号/} /> 处截断
  const re = /(?:fill|stroke|stop-color|color)\s*[:=]\s*["']?\s*([^;"'}>]+)/gi
  let m
  while ((m = re.exec(text))) {
    const token = m[1].trim().toLowerCase()
    if (!token || token === 'none' || token === 'transparent' ||
        token === 'currentcolor' || token === 'inherit' || token.startsWith('url(')) {
      continue
    }
    let rgb = null
    if (token.startsWith('#')) rgb = hexRgb(token)
    else {
      const mm = token.match(/rgba?\(\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?/)
      if (mm) {
        const k = token.includes('%') ? 2.55 : 1
        rgb = [Math.round(Number(mm[1]) * k), Math.round(Number(mm[2]) * k), Math.round(Number(mm[3]) * k)]
      } else if (SVG_GRAY_NAMES.has(token)) {
        rgb = [0, 0, 0] // 具体灰值不重要，r=g=b 即可
      }
    }
    // 解析不出（未知命名色）或任一通道不等 => 视为彩色
    if (!rgb) return false
    if (rgb[0] !== rgb[1] || rgb[1] !== rgb[2]) return false
  }
  return true
}

/** 判断 buf[start] 处是否为任一已知资源的开头，返回类型或 null */
export function sniff(buf, start) {
  if (matches(buf, start, SIG.png)) return { kind: 'image', mime: 'image/png', endAt: (b, s) => pngEnd(b, s) }
  if (buf[start] === 0xff && buf[start + 1] === 0xd8) return { kind: 'image', mime: 'image/jpeg', endAt: (b, s) => jpegEnd(b, s) }
  if (matches(buf, start, 'GIF87a') || matches(buf, start, 'GIF89a')) return { kind: 'image', mime: 'image/gif', endAt: (b, s) => gifEnd(b, s) }
  if (matches(buf, start, 'RIFF') && matches(buf, start + 8, 'WEBP')) return { kind: 'image', mime: 'image/webp', endAt: (b, s) => webpEnd(b, s) }
  // SVG：直接以 <svg 开头，或 <?xml 声明后跟 <svg
  if (matches(buf, start, '<svg') || matches(buf, start, '<?xml')) {
    const probeEnd = Math.min(buf.length, start + 2048)
    const head = utf8(buf.subarray(start, probeEnd))
    if (matches(buf, start, '<svg') || /<svg[\s>]/i.test(head)) {
      return { kind: 'image', mime: 'image/svg+xml', endAt: (b, s) => svgEnd(b, s) }
    }
  }
  if (buf[start] === 0x7b || buf[start] === 0x5b) return { kind: 'json', mime: 'application/json', endAt: (b, s) => jsonEnd(b, s) }
  return null
}

/** 从 offset+1 起寻找下一个可识别资源起点（用于跳过容器中无法识别的填充字节） */
export function nextResource(buf, offset) {
  for (let p = offset + 1; p < buf.length; p++) {
    if (sniff(buf, p)) return p
  }
  return -1
}

/** 前若干字节的十六进制 + 可打印 ASCII 预览（诊断跳过数据用） */
export function hexPreview(buf, start, max = 16) {
  const end = Math.min(buf.length, start + max)
  const hex = []
  const ascii = []
  for (let i = start; i < end; i++) {
    hex.push(buf[i].toString(16).padStart(2, '0'))
    ascii.push(buf[i] >= 0x20 && buf[i] <= 0x7e ? String.fromCharCode(buf[i]) : '·')
  }
  return { hex: hex.join(' '), ascii: ascii.join('') }
}

/** 按文件头魔数猜测数据类型（字体/压缩包等解析器当前不提取的资源） */
export function classifyMagic(buf, start) {
  if (matches(buf, start, '<svg')) return 'SVG 矢量图'
  if (matches(buf, start, '<?xml')) {
    const head = utf8(buf.subarray(start, Math.min(buf.length, start + 2048)))
    if (/<svg[\s>]/i.test(head)) return 'SVG 矢量图（带 XML 声明）'
    return 'XML 文本'
  }
  if (matches(buf, start, 'wOFF')) return 'WOFF 字体'
  if (matches(buf, start, 'wOF2')) return 'WOFF2 字体'
  if (matches(buf, start, 'OTTO')) return 'OpenType/CFF 字体 (otf)'
  if (matches(buf, start, 'true') || matches(buf, start, 'typ1')) return 'TrueType 字体 (ttf)'
  // ttf: 0x00010000
  if (buf[start] === 0x00 && buf[start + 1] === 0x01 && buf[start + 2] === 0x00 && buf[start + 3] === 0x00) {
    return 'TrueType 字体 (ttf)'
  }
  if (matches(buf, start, 'PK\x03\x04') || matches(buf, start, 'PK\x05\x06')) return 'ZIP 数据'
  if (matches(buf, start, '\x1f\x8b')) return 'GZIP 数据'
  if (matches(buf, start, 'BZh')) return 'BZIP2 数据'
  if (buf[start] === 0xfd && matches(buf, start + 1, '7zXZ\x00')) return 'XZ/LZMA 数据'
  if (matches(buf, start, 'Rar!')) return 'RAR 压缩包'
  if (matches(buf, start, '%PDF')) return 'PDF 文档'
  if (matches(buf, start, 'ID3') || (buf[start] === 0xff && (buf[start + 1] & 0xe0) === 0xe0)) return 'MP3 音频'
  if (matches(buf, start, 'fLaC')) return 'FLAC 音频'
  if (matches(buf, start, 'OggS')) return 'OGG 音视频'
  if (buf[start] === 0 && buf[start + 1] === 0 && buf[start + 2] === 0 &&
      (buf[start + 3] === 0x18 || buf[start + 3] === 0x20) && matches(buf, start + 4, 'ftyp')) {
    return 'MP4 视频（ftyp 前置）'
  }
  if (matches(buf, start, 'ftyp')) return 'MP4/QuickTime 视频'
  return null
}

/** 读取图片像素尺寸（失败返回 0,0） */
export async function imageSize(blob) {
  try {
    const bitmap = await createImageBitmap(blob)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  } catch {
    return { width: 0, height: 0 }
  }
}
