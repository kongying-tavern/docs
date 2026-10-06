import { Buffer } from 'node:buffer'
import { crc32 } from 'node:zlib'

export const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64')

// Two 2x2 frames (red/blue). Valid ancillary chunks cross the compression
// threshold without adding large binary fixtures to the repository.
export function animatedWebp(): Buffer {
  const frames = Buffer.from('UklGRoQAAABXRUJQVlA4WAoAAAACAAAAAQAAAQAAQU5JTQYAAAAAAAAAAABBTk1GKAAAAAAAAAAAAAEAAAEAAGQAAAJWUDhMDwAAAC8BQAAABxD9j/4HIqL/AQBBTk1GKAAAAAAAAAAAAAEAAAEAAGQAAABWUDhMDwAAAC8BQAAABxDR//4HIqL/AQA=', 'base64')
  const padding = Buffer.alloc(512 * 1024)
  const header = Buffer.alloc(8)
  header.write('JUNK')
  header.writeUInt32LE(padding.length, 4)
  const bytes = Buffer.concat([frames, header, padding])
  bytes.writeUInt32LE(bytes.length - 8, 4)
  return bytes
}

export function animatedPng(): Buffer {
  const frames = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACGFjVEwAAAACAAAAAPONk3AAAAAaZmNUTAAAAAAAAAACAAAAAgAAAAAAAAAAAAEACgAA6FTcAAAAABBJREFUeJxj/M8AAkxgkgEADR0BA4LJcf8AAAAaZmNUTAAAAAEAAAACAAAAAgAAAAAAAAAAAAEACgAAcyc21AAAABZmZEFUAAAAAnicY2Rg+M/AwMDEAAYACx8BAyVgX34AAAAASUVORK5CYII=', 'base64')
  const chunk = Buffer.alloc(512 * 1024 + 12)
  chunk.writeUInt32BE(chunk.length - 12, 0)
  chunk.write('tEXt', 4)
  chunk.write('padding\0', 8)
  chunk.fill(0x61, 16, chunk.length - 4)
  chunk.writeUInt32BE(crc32(chunk.subarray(4, chunk.length - 4)), chunk.length - 4)
  // Insert between IHDR and acTL to exercise chunk traversal as well.
  return Buffer.concat([frames.subarray(0, 33), chunk, frames.subarray(33)])
}
