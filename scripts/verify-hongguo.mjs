// 用真实解析管线验证红果主题底栏图标识别
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// 模拟浏览器 API（按真实字节解析图片尺寸）
globalThis.URL.createObjectURL = () => 'blob:mock'
globalThis.createImageBitmap = async (blob) => {
  const b = new Uint8Array(await blob.arrayBuffer())
  let width = 0, height = 0
  if (b[0] === 0x89 && b[1] === 0x50) { // PNG IHDR
    width = (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19]
    height = (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23]
  } else if (b[0] === 0xff && b[1] === 0xd8) { // JPEG 扫 SOF
    let p = 2
    while (p < b.length - 9) {
      if (b[p] !== 0xff) { p++; continue }
      const m = b[p + 1]
      if (m === 0xc0 || m === 0xc2) { height = (b[p + 5] << 8) | b[p + 6]; width = (b[p + 7] << 8) | b[p + 8]; break }
      p += 2 + ((b[p + 2] << 8) | b[p + 3])
    }
  }
  return { width, height, close() {} }
}
globalThis.DecompressionStream = class {}
const { Blob: NodeBlob } = await import('node:buffer')
globalThis.Blob = class extends NodeBlob {
  constructor(parts, opts) { super(parts, opts) }
  stream() { return { pipeThrough() { return { getReader: () => ({ read: async () => ({ done: true }) }) } } } }
}

const { parseRedBytes } = await import('../src/lib/red/parse.js')
const { analyzeTheme } = await import('../src/lib/red/analyze.js')

const dir = join(process.env.USERPROFILE, 'Downloads')
const file = readdirSync(dir).find(f => f.endsWith('.red') && f.includes('红果'))
const bytes = readFileSync(join(dir, file))

const parsed = await parseRedBytes(bytes)
console.log('解析完成，资源数:', parsed.assets.length, '警告:', parsed.warnings.length)

const theme = await analyzeTheme({
  fileName: file, size: bytes.length,
  header: parsed.header, assets: parsed.assets, warnings: parsed.warnings
})

const navIcons = theme.assets.filter(a => a.role === '底栏图标')
console.log('\n底栏图标数:', navIcons.length)
navIcons.forEach(a => console.log(`  ${a.mime} ${(a.size / 1024) | 0}KB confidence=${a.confidence} _navMode=${a._navMode || '(shared)'}`))

const others = {}
theme.assets.forEach(a => { others[a.role] = (others[a.role] || 0) + 1 })
console.log('\n角色分布:', others)
