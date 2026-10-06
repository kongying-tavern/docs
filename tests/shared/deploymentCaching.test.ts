import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8')) as {
  headers: Array<{ source: string, headers: Array<{ key: string, value: string }> }>
}
function cachePolicies(path: string): string[] {
  return config.headers.filter(rule => new RegExp(`^${rule.source}$`).test(path))
    .flatMap(rule => rule.headers.filter(header => header.key === 'Cache-Control').map(header => header.value))
}

test('forum HTML and deep links revalidate for every supported locale', () => {
  for (const locale of ['', 'en/', 'ja/']) {
    for (const suffix of ['', '/', '.html', '/topic/123', '/user/alice', '/search'])
      assert.deepEqual(cachePolicies(`/docs/${locale}feedback${suffix}`), ['no-cache'])
  }
})

test('forum HTML revalidation does not disable fingerprinted asset caching', () => {
  for (const path of ['/docs/assets/ForumTopicPreviewContent.a1b2.js', '/docs/fonts/font.a1b2.woff2'])
    assert.deepEqual(cachePolicies(path), ['max-age=31536000, immutable'])
  for (const path of ['/docs/feedback-other', '/docs/images/logo.png', '/docs/en/manual'])
    assert.deepEqual(cachePolicies(path), [])
})
