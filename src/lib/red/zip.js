// ZIP（REDv4 变体）解包 —— 依据 PKZIP 应用笔记中的公开记录格式
// 从末尾 EOCD 定位中央目录，再回溯本地文件头读取数据
import { matches, u16le, u32le, utf8, SIG } from './binary.js'

async function inflateRaw(bytes) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('当前浏览器不支持 DecompressionStream，无法解压 ZIP')
  }
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** 在文件尾部搜索 EOCD（允许其后带注释） */
function findEocd(buf) {
  const min = Math.max(0, buf.length - 22 - 0xffff)
  for (let p = buf.length - 22; p >= min; p--) {
    if (matches(buf, p, SIG.zipEnd)) return p
  }
  return -1
}

/**
 * 解析 ZIP，返回 [{ path, bytes }]
 * 目录条目与不可支持的压缩方法会被跳过（调用方据此收集失败信息）
 * @param baseOffset ZIP 归档在 buf 中的起始偏移（REDv4 为 4：RED + 0x04 前缀）
 */
export async function unzip(buf, baseOffset = 0) {
  const eocd = findEocd(buf)
  if (eocd < 0) throw new Error('ZIP 中未找到 EOCD 记录')

  const count = u16le(buf, eocd + 10)
  let cursor = u32le(buf, eocd + 16) + baseOffset // 中央目录起始偏移（相对归档起点）
  const entries = []

  for (let i = 0; i < count; i++) {
    if (!matches(buf, cursor, SIG.zipCentral)) break
    const method = u16le(buf, cursor + 10)
    const compressedSize = u32le(buf, cursor + 20)
    const nameLen = u16le(buf, cursor + 28)
    const extraLen = u16le(buf, cursor + 30)
    const commentLen = u16le(buf, cursor + 32)
    const localOffset = u32le(buf, cursor + 42)
    const name = utf8(buf.subarray(cursor + 46, cursor + 46 + nameLen))
    entries.push({ name, method, compressedSize, localOffset })
    cursor += 46 + nameLen + extraLen + commentLen
  }

  const files = []
  for (const entry of entries) {
    if (entry.name.endsWith('/')) continue
    const { name, method, compressedSize, localOffset } = entry
    const absLocal = localOffset + baseOffset
    if (!matches(buf, absLocal, SIG.zipLocal)) continue
    const localNameLen = u16le(buf, absLocal + 26)
    const localExtraLen = u16le(buf, absLocal + 28)
    const dataStart = absLocal + 30 + localNameLen + localExtraLen
    const raw = buf.subarray(dataStart, dataStart + compressedSize)
    let bytes
    if (method === 0) bytes = raw.slice()
    else if (method === 8) bytes = await inflateRaw(raw)
    else continue // 其他压缩方法（如 Deflate64/BZip2/LZMA）不支持
    files.push({ path: name, bytes })
  }
  return files
}
