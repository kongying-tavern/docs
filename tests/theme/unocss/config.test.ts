import assert from 'node:assert/strict'
import { createGenerator } from 'unocss'
import { test } from 'vitest'
import { FORUM_MOBILE_BREAKPOINT_PX } from '../../../src/forum/services/forumConfig'
import config from '../../../unocss.config'

test('standard responsive utilities survive the custom mobile breakpoint', async () => {
  const uno = await createGenerator(config)
  const utilities = ['sm:max-w-lg', 'md:flex', 'lg:grid-cols-2', 'xl:grid-cols-3', '2xl:block']
  const { css, matched } = await uno.generate(utilities.join(' '))
  for (const utility of utilities)
    assert.ok(matched.has(utility), `${utility} must generate CSS`)
  for (const width of [640, 768, 1024, 1280, 1536])
    assert.match(css, new RegExp(`@media \\(min-width: ?${width}px\\)`))
  assert.match(css, /max-width:var\(--container-lg\)/)
})

test('site mobile utilities generate CSS at the shared responsive boundary', async () => {
  const uno = await createGenerator(config)
  const { css, matched } = await uno.generate('mobile:flex max-mobile:hidden')
  assert.ok(matched.has('mobile:flex'))
  assert.ok(matched.has('max-mobile:hidden'))
  assert.match(css, new RegExp(`@media \\(min-width: ?${FORUM_MOBILE_BREAKPOINT_PX + 1}px\\)`))
  assert.match(css, new RegExp(`@media \\(max-width: ?${FORUM_MOBILE_BREAKPOINT_PX}px\\)`))
})

test('UI typography utilities use Wind4 theme tokens backed by the centralized scale', async () => {
  const uno = await createGenerator(config)
  const utilities = ['text-sm', 'text-caption', 'text-label', 'text-ui-13', 'leading-ui-19', 'leading-ui-24']
  const { css, matched } = await uno.generate(utilities.join(' '))

  for (const utility of utilities)
    assert.ok(matched.has(utility), `${utility} must generate CSS`)
  assert.match(css, /--text-sm-fontSize: calc\(14px \* var\(--site-ui-scale\)\)/)
  assert.match(css, /--text-sm-lineHeight: calc\(20px \* var\(--site-ui-scale\)\)/)
  assert.match(css, /--text-caption-fontSize: calc\(12px \* var\(--site-ui-scale\)\)/)
  assert.match(css, /--text-caption-lineHeight: calc\(18px \* var\(--site-ui-scale\)\)/)
  assert.match(css, /--text-label-fontSize: calc\(13px \* var\(--site-ui-scale\)\)/)
  assert.match(css, /--text-label-lineHeight: calc\(20px \* var\(--site-ui-scale\)\)/)
  assert.match(css, /--text-ui-13-fontSize: calc\(13px \* var\(--site-ui-scale\)\)/)
  assert.match(css, /--leading-ui-19: calc\(19px \* var\(--site-ui-scale\)\)/)
  assert.match(css, /--leading-ui-24: calc\(24px \* var\(--site-ui-scale\)\)/)
  assert.match(css, /font-size:var\(--text-sm-fontSize\)/)
  assert.match(css, /line-height:var\(--un-leading, var\(--text-sm-lineHeight\)\)/)
  assert.match(css, /font-size:var\(--text-ui-13-fontSize\)/)
  assert.match(css, /line-height:var\(--leading-ui-19\)/)
})

test('rich content uses the official typography preset with scaled root sizes', async () => {
  const uno = await createGenerator(config)
  const utilities = ['prose', 'prose-base', 'prose-sm', 'prose-p:my-0', 'dark:prose-invert']
  const { css, matched } = await uno.generate(utilities.join(' '))

  for (const utility of utilities)
    assert.ok(matched.has(utility), `${utility} must generate CSS`)
  assert.match(css, /font-size:calc\(16px \* var\(--site-ui-scale\)\)/)
  assert.match(css, /font-size:calc\(14px \* var\(--site-ui-scale\)\)/)
  assert.match(css, /max-width:65ch/)
  assert.match(css, /list-style-type:disc/)
  assert.match(css, /border-inline-start-width:0\.25rem/)
})
