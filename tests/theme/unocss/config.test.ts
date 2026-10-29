import assert from 'node:assert/strict'
import { createGenerator } from 'unocss'
import { test } from 'vitest'
import { FORUM_MOBILE_BREAKPOINT_PX } from '../../../src/forum/services/forumConfig'
import config from '../../../unocss.config'

test('scrollbar shortcuts preserve overflow and generate standard and WebKit styling', async () => {
  const uno = await createGenerator({ ...config, safelist: [] })
  for (const utility of ['custom-scrollbar', 'panel-scrollbar', 'VPSidebar', 'scrollbar-none', 'no-scrollbar']) {
    const { css, matched } = await uno.generate(utility)
    assert.ok(matched.has(utility), `${utility} must generate CSS`)
    assert.match(css, /::-webkit-scrollbar/)
    assert.doesNotMatch(css, /overflow(?:-[xy])?:/)
    if (utility.endsWith('none') || utility === 'no-scrollbar') {
      assert.match(css, /scrollbar-width:none/)
      assert.match(css, /display:none/)
    }
    else {
      assert.match(css, /scrollbar-width:thin/)
      assert.match(css, /scrollbar-color:/)
      assert.match(css, /::-webkit-scrollbar-thumb:hover/)
      assert.match(css, /width:10px/)
      assert.match(css, /:focus-within/)
      assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/)
      assert.match(css, /@media \(forced-colors: active\)/)
      assert.match(css, /@media\s*\(pointer:coarse\)/)
      assert.match(css, /@media \(hover: hover\) and \(pointer: fine\) and \(forced-colors: none\)\{[^}]*::-webkit-scrollbar-thumb/)
      assert.match(css, /scrollbar-color:auto/)
    }
  }
})

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

test('Wind4 dimensions, spacing, and variants share the UI spacing unit', async () => {
  const uno = await createGenerator({ ...config, safelist: [] })
  const utilities = ['size-4', 'h-8', 'gap-2', 'px-3', 'leading-6', 'max-mobile:h-9', '[&_svg]:size-4']
  const { css, matched } = await uno.generate(utilities.join(' '))
  for (const utility of utilities)
    assert.ok(matched.has(utility), `${utility} must generate CSS`)
  assert.match(css, /--spacing: calc\(0\.25rem \* var\(--site-ui-scale\)\)/)
  assert.match(css, /width:calc\(var\(--spacing\) \* 4\)/)
  assert.match(css, /height:calc\(var\(--spacing\) \* 8\)/)
  assert.match(css, /gap:calc\(var\(--spacing\) \* 2\)/)
  assert.match(css, /line-height:calc\(var\(--spacing\) \* 6\)/)
  assert.match(css, /height:calc\(var\(--spacing\) \* 9\)/)
})

test('legacy typography scales once without changing absolute geometry or unitless leading', async () => {
  const uno = await createGenerator({ ...config, safelist: [] })
  const { css } = await uno.generate('font-size-3.5 text-14px text-sm lh-24px leading-[1.5] w-300px translate-x-18px important:font-size-3.5 !text-14px hover:font-size-4 sm:lh-24px')
  assert.match(css, /font-size:calc\(0\.875rem \* var\(--site-ui-scale\)\)/)
  assert.match(css, /font-size:calc\(14px \* var\(--site-ui-scale\)\)/)
  assert.match(css, /--un-leading:calc\(24px \* var\(--site-ui-scale\)\)/)
  assert.match(css, /line-height:calc\(24px \* var\(--site-ui-scale\)\)/)
  assert.match(css, /line-height:1\.5/)
  assert.match(css, /width:300px/)
  assert.match(css, /--un-translate-x:18px/)
  assert.match(css, /font-size:calc\(0\.875rem \* var\(--site-ui-scale\)\) !important/)
  assert.match(css, /font-size:calc\(14px \* var\(--site-ui-scale\)\) !important/)
  assert.match(css, /:hover\{font-size:calc\(1rem \* var\(--site-ui-scale\)\)/)
  assert.doesNotMatch(css, /calc\(calc\(/)
})

test('explicit square UI sizes scale without changing absolute layout widths', async () => {
  const uno = await createGenerator({ ...config, safelist: [] })
  const { css } = await uno.generate('size-12px hover:size-24px w-300px h-400px')
  assert.match(css, /width:calc\(12px \* var\(--site-ui-scale\)\)/)
  assert.match(css, /height:calc\(24px \* var\(--site-ui-scale\)\)/)
  assert.match(css, /width:300px/)
  assert.match(css, /height:400px/)
})
