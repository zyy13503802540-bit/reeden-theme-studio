// 全主题回归：放宽方形阈值后底栏图标识别是否正确
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

globalThis.URL.createObjectURL = () => 'blob:mock'
globalThis.createImageBitmap = async (blob) => {
  const b = new Uint8Array(await blob.arrayBuffer())
  let width = 0, height = 0
  if (b[0] === 0x89 && b[1] === 0x50) {
    width = (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19]
    height = (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23]
  } else if (b[0] === 0xff && b[1] === 0xd8) {
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

const { parseRedBytes } = await import('../src/lib/red/parse.js')
const { analyzeTheme } = await import('../src/lib/red/analyze.js')

const dir = join(process.env.USERPROFILE, 'Downloads')
for (const file of readdirSync(dir).filter(f => f.endsWith('.red'))) {
  const bytes = readFileSync(join(dir, file))
  try {
    const parsed = await parseRedBytes(bytes)
    const theme = await analyzeTheme({ fileName: file, size: bytes.length, header: parsed.header, assets: parsed.assets, warnings: parsed.warnings })
    const nav = theme.assets.filter(a => a.role === '底栏图标')
    const byMode = {}
    nav.forEach(a => { const m = a._navMode || 'shared'; byMode[m] = (byMode[m] || 0) + 1 })
    const sizes = [...new Set(nav.map(a => `${a.width}x${a.height}`))].join(',')
    console.log(`${file.slice(0, 30).padEnd(32)} 底栏:${String(nav.length).padStart(2)} ${JSON.stringify(byMode)} 尺寸:[${sizes}]`)
  } catch (e) {
    console.log(`${file.slice(0, 30).padEnd(32)} 解析失败: ${e.message}`)
  }
}
