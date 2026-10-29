import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { preprocessCSS, resolveConfig } from 'vite'
import { test } from 'vitest'
import { compileStyle, parse } from 'vue/compiler-sfc'
import { scaleUiCss } from '../../.vitepress/theme/uiScale'
import { FORUM_MOBILE_BREAKPOINT_PX } from '../../src/forum/services/forumConfig'
import siteConfig from '../../vite.config'

test('shared custom media is lowered with nesting through the actual Vite CSS pipeline', async () => {
  const config = await resolveConfig({ ...siteConfig({ command: 'serve', mode: 'development' }), configFile: false, plugins: [] }, 'serve')
  const result = await preprocessCSS(`
    @import '@/styles/media.css';
    .probe {
      .child { color: red; }
      @media (--site-mobile) { display: none; }
      @media (--site-desktop) { display: grid; }
    }
  `, resolve('tests/theme/probe.css'), config)

  assert.match(result.code, /\.probe \.child/)
  assert.doesNotMatch(result.code, /@custom-media|--site-mobile|--site-desktop/)
  assert.match(result.code, new RegExp(`width\\s*<=\\s*${FORUM_MOBILE_BREAKPOINT_PX}px`))
  assert.match(result.code, new RegExp(`width\\s*>=\\s*${FORUM_MOBILE_BREAKPOINT_PX + 1}px`))
})

test('Vue scoped nested footer rules retain their compiled selectors and responsive conditions', async () => {
  const filename = resolve('.vitepress/theme/components/Footer.vue')
  const { descriptor } = parse(await readFile(filename, 'utf8'), { filename })
  const style = compileStyle({ source: descriptor.styles[0].content, filename, id: 'data-v-css-probe', scoped: true })
  assert.deepEqual(style.errors, [])
  const config = await resolveConfig({ ...siteConfig({ command: 'serve', mode: 'development' }), configFile: false, plugins: [] }, 'serve')
  const result = await preprocessCSS(style.code, `${filename}?vue&type=style&lang.css`, config)
  assert.doesNotMatch(result.code, /@custom-media|--footer-columns|--site-wide/)
  assert.match(result.code, /width\s*>=\s*48rem/)
  assert.match(result.code, /width\s*>=\s*1440px/)
  assert.match(result.code, /\.footer-title button\[data-v-css-probe\]/)
})

test('mobile dialogs retain the independent translate reset against UnoCSS positioning utilities', async () => {
  const filename = resolve('src/forum/components/comment/ForumMobileCommentPanel.vue')
  const { descriptor } = parse(await readFile(filename, 'utf8'), { filename })
  const style = compileStyle({ source: descriptor.styles[0].content, filename, id: 'data-v-dialog-probe', scoped: true })
  assert.deepEqual(style.errors, [])
  const config = await resolveConfig({ ...siteConfig({ command: 'build', mode: 'production' }), configFile: false, plugins: [] }, 'build')
  const result = await preprocessCSS(style.code, `${filename}?vue&type=style&lang.css`, config)
  assert.match(result.code, /translate:\s*none\s*!important/)
})

test.each(['serve', 'build'] as const)('UI source metrics are adapted through the actual %s CSS pipeline', async (command) => {
  const config = await resolveConfig({ ...siteConfig({ command, mode: command === 'serve' ? 'development' : 'production' }), configFile: false, plugins: [] }, command)
  for (const [path, expected] of [
    ['src/forum/components/ui/ForumTopicLifecycle.vue', /font-size:\s*calc\(12px \* var\(--site-ui-scale\)\)/],
    ['src/forum/components/form/ForumEditorTools.vue', /height:\s*max\(36px,\s*calc\(36px \* var\(--site-ui-scale\)\)\)/],
    ['.vitepress/theme/components/ui/search-field/SearchField.vue', /font-size:\s*max\(16px,\s*calc\(16px \* var\(--site-ui-scale\)\)\)/],
  ] as const) {
    const filename = resolve(path)
    const { descriptor } = parse(await readFile(filename, 'utf8'), { filename })
    const style = compileStyle({ source: descriptor.styles[0].content, filename, id: 'data-v-scale-probe', scoped: true })
    assert.deepEqual(style.errors, [])
    // UnoCSS expands directives before Vite CSS; this focused check only exercises the remaining source declarations.
    const id = `${filename}?vue&type=style&lang.css`
    const result = await preprocessCSS(style.code.replace(/@apply\s[^;]+;/g, ''), id, config)
    const adapted = scaleUiCss(result.code, id)!
    assert.match(adapted.code, expected)
    assert.match(adapted.code, /\[data-v-scale-probe\]/)
  }
})
