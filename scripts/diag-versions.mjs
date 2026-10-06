// 检查所有 .red 的版本字节与 payload 布局
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(process.env.USERPROFILE, 'Downloads')
for (const file of readdirSync(dir).filter(f => f.endsWith('.red'))) {
  const buf = readFileSync(join(dir, file))
  if (buf[0] !== 0x52 || buf[1] !== 0x45 || buf[2] !== 0x44) continue
  const v = buf[3]
  let info = `v=0x${v.toString(16).padStart(2, '0')}`
  if (v === 0x10 || v === 0x00 || v === 0x02) {
    try {
      const headerLen = buf.readUInt32BE(4)
      const h = JSON.parse(buf.subarray(8, 8 + headerLen).toString())
      const payloadStart = 8 + headerLen + Number(h.manifestLength || 0)
      info += ` ver=${h.version} type=${h.resourceType || '-'} mode=${h.containerMode || '-'} algo=${h.algorithm || '-'} manifest=${h.manifestLength || 0} payload=${buf.length - payloadStart}字节`
    } catch (e) { info += ' 头解析失败' }
  }
  console.log(`${file}  ${info}`)
}
