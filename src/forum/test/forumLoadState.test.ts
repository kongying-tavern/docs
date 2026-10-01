/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

test('load state text prioritizes pending requests over empty, terminal and retry text', async () => {
  const source = await readFile(new URL('../components/ui/ForumLoadState.vue', import.meta.url), 'utf8')
  const expression = source.match(/<TextMorph :text="([^"]+)"/)?.[1]
  assert.ok(expression)
  const message = { ui: { button: { loading: 'Loading' } }, forum: { auth: { callback: { error: { retry: 'Retry' } } } } }
  const resolveText = (loading: boolean, loadingText: string | undefined, error: boolean, text: string) =>
    runInNewContext(expression, { loading, loadingText, error, text, message }, { timeout: 1000 })

  for (const text of ['No comments', 'No more', 'Load more']) {
    assert.equal(resolveText(true, undefined, false, text), 'Loading')
    assert.equal(resolveText(true, undefined, true, text), 'Loading')
    assert.equal(resolveText(false, undefined, false, text), text)
  }
  assert.equal(resolveText(true, 'Loading comments', true, 'No comments'), 'Loading comments')
  assert.equal(resolveText(false, undefined, true, 'No more'), 'Retry')
})
