/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

test('image container stays mounted when every displayed image has failed', async () => {
  const source = await readFile(new URL('../components/ui/ForumImage.vue', import.meta.url), 'utf8')
  const condition = source.match(/<ForumImagePreviewer\s+v-if="([^"]+)"/)?.[1]
  assert.ok(condition)
  const images = [{ src: 'missing.webp' }]
  const shouldRender = (displayImages: unknown[], validImages: unknown[]) =>
    runInNewContext(condition, { displayImages, validImages }, { timeout: 1000 })

  assert.equal(shouldRender(images, images), true)
  assert.equal(shouldRender(images, []), true)
  assert.equal(shouldRender([], []), false)
})
