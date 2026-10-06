// 诊断标题样式包（version byte 0x10）结构
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync, inflateSync } from 'node:zlib'

const dir = join(process.env.USERPROFILE, 'Downloads')
const file = readdirSync(dir).find(f => f.includes('标题样式'))
const buf = readFileSync(join(dir, file))
console.log('文件:', file, buf.length, '字节')
console.log('前 32 字节 hex:', [...buf.subarray(0, 32)].map(b => b.toString(16).padStart(2, '0')).join(' '))
console.log('前 32 字节 ascii:', buf.subarray(0, 32).toString('latin1').replace(/[^\x20-\x7e]/g, '·'))

// 假设 RED\x10 + u32be 头长 + JSON 头
if (buf[0] === 0x52 && buf[1] === 0x45 && buf[2] === 0x44) {
  const headerLen = buf.readUInt32BE(4)
  console.log('\n按 v2 布局读头长:', headerLen)
  if (headerLen > 0 && headerLen < 100000 && 8 + headerLen <= buf.length) {
    try {
      const header = JSON.parse(buf.subarray(8, 8 + headerLen).toString())
      console.log('头部 JSON:', JSON.stringify(header).slice(0, 400))
      const manifestLen = Number(header.manifestLength || 0)
      const payloadStart = 8 + headerLen + manifestLen
      console.log('manifestLength:', manifestLen, 'payload 起点:', payloadStart)
      if (manifestLen) {
        console.log('manifest 前 200:', buf.subarray(8 + headerLen, 8 + headerLen + 200).toString('latin1').replace(/[^\x20-\x7e]/g, '·'))
      }
      console.log('payload 前 64 hex:', [...buf.subarray(payloadStart, payloadStart + 64)].map(b => b.toString(16).padStart(2, '0')).join(' '))
      // payload 是 gzip？
      if (buf[payloadStart] === 0x1f && buf[payloadStart + 1] === 0x8b) {
        const de = gunzipSync(buf.subarray(payloadStart))
        console.log('payload gunzip 后:', de.length, '字节, 前 200:', de.subarray(0, 200).toString('latin1').replace(/[^\x20-\x7e]/g, '·'))
      }
      // payload 直接是 JSON？
      if (buf[payloadStart] === 0x7b || buf[payloadStart] === 0x5b) {
        console.log('payload 是裸 JSON')
      }
    } catch (e) {
      console.log('头部 JSON 解析失败:', e.message)
    }
  }
}
