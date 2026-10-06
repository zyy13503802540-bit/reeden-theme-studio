// 读红果包中 navMeta 附近图片的真实尺寸（PNG 直接读 IHDR）
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(process.env.USERPROFILE, 'Downloads')
const file = readdirSync(dir).find(f => f.endsWith('.red') && f.includes('红果'))
const buf = readFileSync(join(dir, file))

function pngSize(start) {
  return { w: buf.readUInt32BE(start + 16), h: buf.readUInt32BE(start + 20) }
}
function jpgSize(start) {
  let p = start + 2
  while (p < buf.length) {
    if (buf[p] !== 0xff) { p++; continue }
    const marker = buf[p + 1]
    if (marker === 0xc0 || marker === 0xc2) {
      return { h: buf.readUInt16BE(p + 5), w: buf.readUInt16BE(p + 7) }
    }
    const len = buf.readUInt16BE(p + 2)
    p += 2 + len
  }
  return { w: 0, h: 0 }
}

// 扫描 navMeta @14930279 前后 15 张图
let p = 8 + buf.readUInt32BE(4) + 13982
const items = []
while (p < buf.length) {
  if (buf.readUInt32BE(p) === 0x89504e47) {
    let end = p + 8
    while (end < buf.length) {
      const len = buf.readUInt32BE(end)
      const type = buf.subarray(end + 4, end + 8).toString('ascii')
      end += 12 + len
      if (type === 'IEND') break
    }
    const { w, h } = pngSize(p)
    items.push({ type: 'png', start: p, end, size: end - p, w, h })
    p = end
  } else if (buf[p] === 0xff && buf[p + 1] === 0xd8) {
    let end = buf.indexOf(Buffer.from([0xff, 0xd9]), p)
    end = end < 0 ? buf.length : end + 2
    const { w, h } = jpgSize(p)
    items.push({ type: 'jpg', start: p, end, size: end - p, w, h })
    p = end
  } else if (buf[p] === 0x7b || buf[p] === 0x5b) {
    let depth = 0, inStr = false, esc = false, i = p
    for (; i < buf.length; i++) {
      const c = buf[i]
      if (esc) { esc = false; continue }
      if (c === 0x5c) { esc = true; continue }
      if (c === 0x22) inStr = !inStr
      if (inStr) continue
      if (c === 0x7b || c === 0x5b) depth++
      if (c === 0x7d || c === 0x5d) { depth--; if (!depth) { i++; break } }
    }
    items.push({ type: 'json', start: p, end: i })
    p = i
  } else p++
}

const metaIdx = items.findIndex(it => it.type === 'json' && it.start === 14930279)
console.log('navMeta 索引:', metaIdx)
console.log('\nnavMeta 前 15 项:')
for (let i = Math.max(0, metaIdx - 15); i < metaIdx; i++) {
  const it = items[i]
  console.log(`  [${i}] ${it.type} ${(it.size / 1024).toFixed(1)}KB`, it.w ? `${it.w}x${it.h} 比例差:${(Math.abs(it.w - it.h) / Math.max(it.w, it.h) * 100).toFixed(0)}%` : '')
}
console.log('\nnavMeta 后 5 项:')
for (let i = metaIdx + 1; i < Math.min(items.length, metaIdx + 6); i++) {
  const it = items[i]
  console.log(`  [${i}] ${it.type} ${(it.size / 1024).toFixed(1)}KB`, it.w ? `${it.w}x${it.h} 比例差:${(Math.abs(it.w - it.h) / Math.max(it.w, it.h) * 100).toFixed(0)}%` : '')
}
