import Compressor from 'compressorjs'

const COMPRESSIBLE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const MIN_COMPRESSION_BYTES = 512 * 1024

export function compressImageForUpload(file: File): Promise<File> {
  if (file.size < MIN_COMPRESSION_BYTES || !COMPRESSIBLE_IMAGE_TYPES.has(file.type))
    return Promise.resolve(file)

  return new Promise((resolve) => {
    // eslint-disable-next-line no-new -- Compressor starts its asynchronous work in the constructor.
    new Compressor(file, {
      quality: 0.9,
      maxWidth: 4096,
      maxHeight: 4096,
      convertSize: Number.POSITIVE_INFINITY,
      success(result) {
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
