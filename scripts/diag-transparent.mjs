// 用项目解析器查看各主题封面图库 meta 的 transparentOptimization 取值
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// mock 浏览器 API
globalThis.URL.createObjectURL = () => 'blob:mock'
globalThis.createImageBitmap = async () => ({ width: 100, height: 100, close() {} })
globalThis.DecompressionStream = (await import('node:stream/web')).DecompressionStream
if (!globalThis.atob) globalThis.atob = s => Buffer.from(s, 'base64').toString('binary')

const { parseRedBytes } = await import('../src/lib/red/parse.js')

const dir = join(process.env.USERPROFILE, 'Downloads')
for (const file of readdirSync(dir).filter(f => f.endsWith('.red'))) {
  const buf = new Uint8Array(readFileSync(join(dir, file)))
  try {
    const { assets, encrypted } = await parseRedBytes(buf)
    if (encrypted) continue
    for (const a of assets) {
      if (a.type === 'json' && a.data && Object.prototype.hasOwnProperty.call(a.data, 'transparentOptimization')) {
        console.log(file.slice(0, 34), '→', JSON.stringify(a.data).slice(0, 400))
      }
    }
  } catch {}
}
