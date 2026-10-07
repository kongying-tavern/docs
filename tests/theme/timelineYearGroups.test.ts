import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { createMarkdownRenderer } from 'vitepress'
import { test } from 'vitest'
import { markdownConfig } from '../../.vitepress/config/markdown'

test('timeline marks only the first dated entry and subsequent year changes', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const source = `
::: timeline 2025-12-03 | Version 3
- Latest
:::
::: timeline 2025-01-15 | Version 2
- Previous
:::
::: timeline Undated
- No date
:::
::: timeline 2024-12-01 | Version 1
- Older
:::
`
  for (let pass = 0; pass < 2; pass++) {
    const html = await markdown.renderAsync(source)
    const classes = [...html.matchAll(/<div class='(timeline-dot[^']*)'>/g)].map(match => match[1])
    assert.deepEqual(classes.map(value => value.includes('timeline-dot-year-start')), [true, false, false, true])
    assert.equal(html.match(/class='timeline-dot-date-year'/g)?.length, 3, 'Keep full dates available on mobile and to screen readers')
    assert.equal(html.match(/class='timeline-dot-year-backdrop' aria-hidden='true'/g)?.length, 2, 'Render decorative years in initial HTML only when the year changes')
    assert.ok(html.includes('id=\'version-3\''), 'Preserve existing version anchors')
  }
})

test('timeline localizes dates at render time without timezone drift', async () => {
  const markdown = await createMarkdownRenderer(resolve('src'), markdownConfig)
  const source = '::: timeline 2025-12-03 | Version 3\n- Latest\n:::'
  for (const [locale, fullDate, monthDay] of [
    ['zh', '2025年12月3日', '12月3日'],
    ['en', 'Dec 3, 2025', 'Dec 3'],
    ['ja', '2025年12月3日', '12月3日'],
  ]) {
    const html = await markdown.renderAsync(source, { relativePath: `${locale}/blog/posts/test.md` })
    assert.ok(html.includes(`datetime='2025-12-03' aria-label='${fullDate}'`))
    const compact = html.match(/class='timeline-dot-date-md'>(.*?)<\/span><\/time>/)?.[1]
    assert.equal(compact?.replace(/<[^>]*>/g, ''), monthDay)
  }
})
