import type { data } from '../../src/_data/posts.data'
import assert from 'node:assert/strict'
import { test } from 'vitest'

// tsc checks the real public data type without importing a build-time loader at runtime.
type ListingPost = typeof data[number]
type HasContent = 'content' extends keyof ListingPost ? true : false
const hasContent: HasContent = false
test('blog listing data does not expose the full article content', () => {
  assert.equal(hasContent, false)
})
