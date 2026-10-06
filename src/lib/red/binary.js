// 基础二进制读取工具 —— 全部基于 DataView，无第三方依赖

const decoder = new TextDecoder('utf-8')

export function utf8(bytes) {
  return decoder.decode(bytes)
}

export function u16le(b, o) {
  return b[o] | (b[o + 1] << 8)
}

export function u32le(b, o) {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0
}

export function u32be(b, o) {
  return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0
}

/** 判断 buf 自 offset 起的字节是否与 ASCII 签名一致 */
export function matches(buf, offset, signature) {
  if (offset + signature.length > buf.length) return false
  for (let i = 0; i < signature.length; i++) {
    if (buf[offset + i] !== signature.charCodeAt(i)) return false
  }
  return true
}

export const SIG = {
  png: '\x89PNG\r\n\x1a\n',
  jpeg: [0xff, 0xd8],
  gif: ['GIF87a', 'GIF89a'],
  riff: 'RIFF',
  webp: 'WEBP',
  zipLocal: 'PK\x03\x04',
  zipCentral: 'PK\x01\x02',
  zipEnd: 'PK\x05\x06'
}

/** 分块把字节数组转 binary 字符串，避免 apply 参数过多导致栈溢出 */
export function bytesToBinary(bytes) {
  let out = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    out += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)))
  }
  return out
}
