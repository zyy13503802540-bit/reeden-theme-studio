// 诊断溶溶月（阅读主题）导入问题
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

const dir = join(process.env.USERPROFILE, 'Downloads')
const file = readdirSync(dir).find(f => f.includes('溶溶月'))
const bytes = readFileSync(join(dir, file))
console.log('文件:', file, bytes.length, '字节')
console.log('前 16 字节 hex:', [...bytes.subarray(0, 16)].map(b => b.toString(16).padStart(2, '0')).join(' '))
console.log('前 16 字节 ascii:', bytes.subarray(0, 16).toString('latin1').replace(/[^\x20-\x7e]/g, '·'))

const { parseRedBytes } = await import('../src/lib/red/parse.js')
const { analyzeTheme } = await import('../src/lib/red/analyze.js')
try {
  const parsed = await parseRedBytes(bytes)
  console.log('解析成功，资源数:', parsed.assets.length, 'header:', JSON.stringify(parsed.header))
  console.log('警告:', parsed.warnings)
  const theme = await analyzeTheme({
  fileName: file, size: bytes.length,
  header: parsed.header, assets: parsed.assets, warnings: parsed.warnings
})
console.log('标题:', theme.title, '| isResourceOnly:', theme.isResourceOnly, '| kind:', theme.resourceKind)
console.log('readers:', theme.readers.length, '| themeMode:', theme.readers[0]?.themeMode)
console.log('highlightRules:', theme.highlightRules.length, theme.highlightRules.map(r => r.name || r.title))
const img = theme.assets.find(a => a.type === 'image')
console.log('背景图:', img?.mime, (img?.size / 1024) | 0, 'KB role:', img?.role, 'hash 匹配:', img?.hash === theme.readers[0]?.backgroundImageUrl)
const { rulesForMode } = await import('../src/lib/theme-ui.js')
console.log('light 模式规则数:', rulesForMode(theme.highlightRules, 'light').length)
} catch (e) {
  console.log('失败:', e.message)
  console.log(e.stack?.split('\n').slice(0, 4).join('\n'))
}
