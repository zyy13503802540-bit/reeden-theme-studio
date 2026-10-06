// 诊断溶溶月 RED v1 容器
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'

const file = join(process.env.USERPROFILE, 'Downloads/阅读主题 - 耶耶-溶溶月(1).red')
const buf = readFileSync(file)

console.log('RED version:', buf[3])
console.log('第 5 字节开始:', buf[4], buf[5], buf[6], buf[7], '→ gzip?', buf[4]===0x1f && buf[5]===0x8b)

// 从第 5 字节开始解压 gzip（RED\x01 前缀 4 字节之后）
try {
  const decompressed = gunzipSync(buf.subarray(4))
  console.log('解压后大小:', decompressed.length)
  console.log('前 200 字节 ascii:', decompressed.subarray(0, 200).toString('latin1').replace(/[^\x20-\x7e\n]/g, '·'))
  // 看看开头是否是 JSON
  const head = decompressed.subarray(0, 50).toString('utf8')
  console.log('utf8 前 50:', head)
  // 找 JSON 结束
  if (head[0] === '{' || head[0] === '[') {
    let depth = 0, inStr = false, esc = false
    for (let i = 0; i < decompressed.length; i++) {
      const c = decompressed[i]
      if (esc) { esc = false; continue }
      if (c === 0x5c) { esc = true; continue }
      if (c === 0x22) inStr = !inStr
      if (inStr) continue
      if (c === 0x7b || c === 0x5b) depth++
      if (c === 0x7d || c === 0x5d) { depth--; if (!depth) { console.log('JSON 长度:', i+1); break } }
    }
  }
  // 资源扫描：找 PNG/JPG
  let pngs = 0, jpgs = 0
  for (let p = 0; p < decompressed.length - 4; p++) {
    if (decompressed.readUInt32BE(p) === 0x89504e47) pngs++
    if (decompressed[p] === 0xff && decompressed[p+1] === 0xd8) jpgs++
  }
  console.log('PNG 数:', pngs, 'JPG 数:', jpgs)
} catch (e) {
  console.log('解压失败:', e.message)
}
