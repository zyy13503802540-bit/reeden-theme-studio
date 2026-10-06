// 诊断"姜荷"高亮规则包结构
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'

const dir = join(process.env.USERPROFILE, 'Downloads')
const files = readdirSync(dir).filter(f => /姜|荷/.test(f))
console.log('匹配文件:', files)
for (const file of files) {
  const buf = readFileSync(join(dir, file))
  console.log('\n==', file, buf.length, '字节')
  console.log('前 16 hex:', [...buf.subarray(0, 16)].map(b => b.toString(16).padStart(2, '0')).join(' '))
  if (buf[0] !== 0x52 || buf[1] !== 0x45 || buf[2] !== 0x44) { console.log('非 RED 文件'); continue }
  const v = buf[3]
  console.log('版本字节: 0x' + v.toString(16).padStart(2, '0'))
  if (v === 0x01) {
    // v1: gzip JSON
    try {
      const de = gunzipSync(buf.subarray(4))
      const json = JSON.parse(de.toString())
      console.log('v1 头:', JSON.stringify({ version: json.version, type: json.type, dataCount: json.data?.length }))
      const d = json.data?.[0] || {}
      console.log('字段:', Object.keys(d).join(', '))
      console.log('name:', d.name, '| themeMode:', d.themeMode)
      console.log('规则数:', (d.rules || d.highlightRules || []).length, '| boundHighlightRules:', (d.boundHighlightRules || []).length)
      const rules = d.rules || d.highlightRules || d.boundHighlightRules || []
      for (const r of rules.slice(0, 10)) {
        const rule = r.rule || r
        console.log(' -', rule.name, '| regex:', String(rule.regex || rule.pattern || '').slice(0, 60), '| css长度:', String(rule.styleCssText || '').length, '| 内嵌图:', rule.styleCssText?.includes('base64') || !!rule.backgroundImageData)
      }
      if (d.backgroundImageData) console.log('backgroundImageData 长度:', d.backgroundImageData.length)
    } catch (e) { console.log('gunzip 失败:', e.message) }
  } else {
    const headerLen = buf.readUInt32BE(4)
    console.log('头长:', headerLen)
    if (headerLen < 100000) {
      try { console.log('头部:', JSON.stringify(JSON.parse(buf.subarray(8, 8 + headerLen).toString())).slice(0, 300)) } catch {}
    }
  }
}
