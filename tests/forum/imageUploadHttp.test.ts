import type { INTER_KNOT } from '../../src/apis/interknot.site/api'
import type { ImageUploadRequest } from '../../src/apis/interknot.site/upload'
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { uploadImg } from '../../src/apis/interknot.site/upload'

const response: INTER_KNOT.ImageResponse = {
  statusCode: 200,
  data: {
    pathname: 'test.png',
    contentType: 'image/png',
    size: 4,
    httpEtag: 'etag',
    uploadedAt: '2026-08-24T00:00:00Z',
    httpMetadata: { contentType: 'image/png' },
    customMetadata: {},
  },
}

test('one logical upload attempt sends one POST with automatic retries disabled', async () => {
  let posts = 0
  const request: ImageUploadRequest = (_endpoint, options) => {
    posts++
    assert.equal(options.retry, 0)
    return { json: async () => response }
  }

  await uploadImg(new File(['test'], 'test.png', { type: 'image/png' }), { request })
  assert.equal(posts, 1)
})

test('an explicit user retry is a separate visible attempt', async () => {
  let posts = 0
  const request: ImageUploadRequest = () => {
    posts++
    return {
      json: async () => {
        if (posts === 1)
          throw new Error('network failed')
        return response
      },
    }
  }
  const selected = new File(['test'], 'test.png', { type: 'image/png' })

  await assert.rejects(uploadImg(selected, { request }), /network failed/)
  assert.equal(posts, 1)
  await uploadImg(selected, { request })
  assert.equal(posts, 2)
})

test('the shared HTTP entry reuses identical original files across separately selected attachments', async () => {
  let posts = 0
  const request: ImageUploadRequest = (_endpoint, options) => {
    posts++
    assert.equal(options.retry, 0)
    assert.equal(options.body.get('file') instanceof File, true)
    return { json: async () => response }
  }
  const original = new File(['original bytes'], 'source.png', { type: 'image/png' })
  const compressed = new File(['compressed bytes'], 'source.png', { type: 'image/png' })
  const first = await uploadImg(compressed, { request, originalFile: original })
  const second = await uploadImg(compressed, {
    request,
    originalFile: new File(['original bytes'], 'renamed.png', { type: 'image/png' }),
  })
  assert.deepEqual(second, first)
  assert.equal(posts, 1)
})
