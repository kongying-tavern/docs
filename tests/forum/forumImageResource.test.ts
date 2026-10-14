import { strict as assert } from 'node:assert'
import { test } from 'vitest'
import { imageFileName } from '../../src/forum/services/forumImageResource'

test('image save names preserve original extensions and sanitize picker-invalid characters', () => {
  assert.equal(imageFileName({ src: 'https://example.com/images/screen%20shot.jpeg?version=1#section' }), 'screen shot.jpeg')
  assert.equal(imageFileName({ src: 'blob:https://example.com/id', fileName: 'original.png' }), 'original.png')
  assert.equal(imageFileName({ src: 'https://example.com/image%2F%00.jpeg' }), 'image__.jpeg')
  assert.equal(imageFileName({ src: 'https://example.com/%ZZ' }), 'image')
})
