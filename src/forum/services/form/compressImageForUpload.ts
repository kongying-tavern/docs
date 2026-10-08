import Compressor from 'compressorjs'

const COMPRESSIBLE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const MIN_COMPRESSION_BYTES = 512 * 1024

async function hasAnimation(file: File): Promise<boolean> {
  if (file.type === 'image/webp') {
    // WebP VP8X's animation flag. Canvas encoding would discard its frames.
    const header = new Uint8Array(await file.slice(0, 21).arrayBuffer())
    return String.fromCharCode(...header.subarray(8, 16)) === 'WEBPVP8X'
      && Boolean(header[20] & 0x02)
  }
  if (file.type === 'image/png') {
    // APNG's acTL must precede IDAT; skip payloads instead of reading pixels.
    let offset = 8
    while (offset + 12 <= file.size) {
      const header = await file.slice(offset, offset + 8).arrayBuffer()
      const length = new DataView(header).getUint32(0)
      const type = String.fromCharCode(...new Uint8Array(header, 4, 4))
      if (offset + length + 12 > file.size)
        return false
      if (type === 'acTL')
        return true
      if (type === 'IDAT' || type === 'IEND')
        return false
      offset += length + 12
    }
  }
  return false
}

export async function compressImageForUpload(file: File): Promise<File> {
  if (file.size < MIN_COMPRESSION_BYTES || !COMPRESSIBLE_IMAGE_TYPES.has(file.type))
    return file

  if (await hasAnimation(file))
    return file

  return new Promise((resolve) => {
    // eslint-disable-next-line no-new -- Compressor starts its asynchronous work in the constructor.
    new Compressor(file, {
      quality: 0.9,
      maxWidth: 4096,
      maxHeight: 4096,
      convertSize: Number.POSITIVE_INFINITY,
      success(result: File | Blob) {
        // CompressorJS 的 File 构造失败时会回落 Blob，其 .d.ts 未覆盖该分支。
        const compressed = result instanceof File
          ? result
          : new File([result], file.name, {
              type: result.type || file.type,
              lastModified: file.lastModified,
            })
        resolve(compressed.size < file.size ? compressed : file)
      },
      error() {
        resolve(file)
      },
    })
  })
}
