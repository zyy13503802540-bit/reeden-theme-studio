// RED 解析统一入口：File -> 主题模型
import { parseRedBytes } from './parse.js'
import { analyzeTheme } from './analyze.js'

export async function parseRedFile(file, hooks = {}) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const parsed = await parseRedBytes(bytes, hooks)
  return await analyzeTheme({
    fileName: file.name,
    size: file.size,
    header: parsed.header,
    assets: parsed.assets,
    warnings: parsed.warnings,
    encrypted: !!parsed.encrypted
  })
}

export { parseRedBytes } from './parse.js'
export { normalizeLayout, extractRules } from './analyze.js'
