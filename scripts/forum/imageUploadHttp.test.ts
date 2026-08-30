/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import type { INTER_KNOT } from '../../.vitepress/theme/apis/interknot.site/api'
import type { ImageUploadRequest } from '../../.vitepress/theme/apis/interknot.site/upload'
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { uploadImg } from '../../.vitepress/theme/apis/interknot.site/upload'

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
