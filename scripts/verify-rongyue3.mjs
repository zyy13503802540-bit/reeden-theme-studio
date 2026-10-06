// 查看溶溶月 v1 JSON 的完整结构
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'

const file = join(process.env.USERPROFILE, 'Downloads/阅读主题 - 耶耶-溶溶月(1).red')
const data = JSON.parse(gunzipSync(readFileSync(file).subarray(4)).toString())

console.log('顶层 keys:', Object.keys(data))
console.log('type:', data.type, 'version:', data.version)
console.log('data 数组长度:', data.data.length)

const first = data.data[0]
console.log('\n第一项 keys:', Object.keys(first))
for (const [k, v] of Object.entries(first)) {
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  console.log(`  ${k}: ${s.length > 120 ? s.slice(0, 120) + '…(' + s.length + '字符)' : s}`)
}
// 检查 backgroundImageUrl 是否是包外引用（无对应图片资源）
// 以及整个 JSON 里有没有内嵌 base64 图片
const raw = JSON.stringify(data)
console.log('\n含 data:image 数:', (raw.match(/data:image/g) || []).length)
console.log('含 base64 长字符串(>10KB):', /[A-Za-z0-9+/=]{10000,}/.test(raw))
