import assert from 'node:assert/strict'
import { test, vi } from 'vitest'
import { compressImageForUpload } from '../../src/forum/services/form/compressImageForUpload'

const MIN_COMPRESSION_BYTES = 512 * 1024

const mocks = vi.hoisted(() => ({
  calls: [] as Array<{ file: File, options: Record<string, unknown> }>,
  behavior: 'smaller' as 'smaller' | 'bigger' | 'blob' | 'error',
}))

vi.mock('compressorjs', () => ({
  default: class {
    constructor(file: File, options: Record<string, unknown>) {
      mocks.calls.push({ file, options })
      const fail = options.error as () => void
      const succeed = options.success as (result: unknown) => void
      if (mocks.behavior === 'error') {
        fail()
        return
      }
      if (mocks.behavior === 'bigger') {
        succeed(new File([new Uint8Array(file.size + 1024)], 'bigger.jpg', { type: 'image/jpeg' }))
        return
      }
      if (mocks.behavior === 'blob') {
        succeed(new Blob([new Uint8Array(1024)], { type: 'image/jpeg' }))
        return
      }
      succeed(new File([new Uint8Array(1024)], 'compressed.jpg', { type: 'image/jpeg' }))
    }
  },
}))

function imageFile(type: string, size = MIN_COMPRESSION_BYTES + 1, mutate?: (bytes: Uint8Array) => void): File {
  const bytes = new Uint8Array(size)
  bytes.set([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], 0)
  mutate?.(bytes)
  return new File([bytes], 'screenshot.png', { type })
}

function withFirstChunk(type: string, chunkType: string, size?: number): File {
  return imageFile(type, size, (bytes) => {
    bytes.set([...chunkType].map(character => character.charCodeAt(0)), 12)
  })
}

function withWebpHeader(animated: boolean): File {
  return imageFile('image/webp', MIN_COMPRESSION_BYTES + 32, (bytes) => {
    bytes.set([...'WEBPVP8X'].map(character => character.charCodeAt(0)), 8)
    bytes[20] = animated ? 0x02 : 0
  })
}

test('small and unsupported files skip compression entirely', async () => {
  mocks.calls.length = 0
  const small = imageFile('image/png', MIN_COMPRESSION_BYTES - 1)
  assert.equal(await compressImageForUpload(small), small)

  // 阈值边界：达到 512KiB 才进入压缩流程
  const atLimit = withFirstChunk('image/png', 'IDAT')
  mocks.behavior = 'smaller'
  assert.notEqual(await compressImageForUpload(atLimit), atLimit)

  const gif = imageFile('image/gif')
  assert.equal(await compressImageForUpload(gif), gif)
  assert.equal(mocks.calls.length, 1)
})

test('animated PNG and WebP keep their frames untouched', async () => {
  mocks.calls.length = 0
  const apng = withFirstChunk('image/png', 'acTL')
  assert.equal(await compressImageForUpload(apng), apng)

  const animatedWebp = withWebpHeader(true)
  assert.equal(await compressImageForUpload(animatedWebp), animatedWebp)

  // 动画判定不成立时仍走压缩，说明上面的返回不是“类型不支持”造成的
  mocks.behavior = 'smaller'
  assert.notEqual(await compressImageForUpload(withWebpHeader(false)), animatedWebp)
  assert.equal(mocks.calls.length, 1)
})

test('truncated chunks never read as animation', async () => {
  mocks.calls.length = 0
  mocks.behavior = 'error'
  // 声明的 chunk 长度超出文件：畸形 PNG 必须回落到普通压缩路径
  const truncated = imageFile('image/png', MIN_COMPRESSION_BYTES + 4, (bytes) => {
    new DataView(bytes.buffer).setUint32(8, bytes.length + 1024)
    bytes.set([...'acTL'].map(character => character.charCodeAt(0)), 12)
  })
  await compressImageForUpload(truncated)
  assert.equal(mocks.calls.length, 1)
})

test('compression uses the documented budget and never uploads a larger file', async () => {
  mocks.calls.length = 0
  const original = withFirstChunk('image/png', 'IDAT')

  mocks.behavior = 'smaller'
  const compressed = await compressImageForUpload(original)
  assert.deepEqual(mocks.calls[0].options, {
    quality: 0.9,
    maxWidth: 4096,
    maxHeight: 4096,
    convertSize: Number.POSITIVE_INFINITY,
    success: mocks.calls[0].options.success,
    error: mocks.calls[0].options.error,
  })
  assert.equal(compressed.size, 1024)

  mocks.behavior = 'bigger'
  assert.equal(await compressImageForUpload(original), original)
})

test('blob results become named files and failures fall back to the original', async () => {
  mocks.calls.length = 0
  const original = withFirstChunk('image/png', 'IDAT')

  mocks.behavior = 'blob'
  const wrapped = await compressImageForUpload(original)
  assert.ok(wrapped instanceof File, 'a Blob result must be wrapped as a File')
  assert.equal(wrapped.name, original.name)
  assert.equal(wrapped.type, 'image/jpeg')

  mocks.behavior = 'error'
  assert.equal(await compressImageForUpload(original), original)
})
