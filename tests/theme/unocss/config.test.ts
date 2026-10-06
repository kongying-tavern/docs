import assert from 'node:assert/strict'
import test from 'node:test'
import { createGenerator } from 'unocss'
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
