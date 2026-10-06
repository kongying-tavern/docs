import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { preprocessCSS, resolveConfig } from 'vite'
import { compileStyle, parse } from 'vue/compiler-sfc'
import { FORUM_MOBILE_BREAKPOINT_PX } from '../../src/forum/services/forumConfig'
import siteConfig from '../../vite.config'

test('shared custom media is lowered with nesting through the actual Vite CSS pipeline', async () => {
  const config = await resolveConfig({ ...siteConfig, configFile: false, plugins: [] }, 'serve')
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
  const config = await resolveConfig({ ...siteConfig, configFile: false, plugins: [] }, 'serve')
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
  const config = await resolveConfig({ ...siteConfig, configFile: false, plugins: [] }, 'build')
  const result = await preprocessCSS(style.code, `${filename}?vue&type=style&lang.css`, config)
  assert.match(result.code, /translate:\s*none\s*!important/)
})
