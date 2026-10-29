import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { transform } from 'lightningcss'
import { test } from 'vitest'
import { createUiScaleVisitor } from '../../.vitepress/theme/uiScale'

function compile(css: string, filename = '/project/src/forum/components/Control.vue'): string {
  return transform({ filename, code: Buffer.from(css), visitor: createUiScaleVisitor() }).code.toString()
}

test('legacy UI typography scales once while unitless leading and non-UI content stay unchanged', () => {
  const css = '.copy{font-size:12px!important;line-height:20px}.scaled{font-size:calc(14px * var(--site-ui-scale));line-height:1.5}'
  const output = compile(css)
  assert.match(output, /font-size: calc\(12px \* var\(--site-ui-scale\)\) !important/)
  assert.match(output, /line-height: calc\(20px \* var\(--site-ui-scale\)\)/)
  assert.match(output, /line-height: 1\.5/)
  assert.doesNotMatch(output, /calc\(calc/)
  assert.doesNotMatch(compile(css, '/project/src/zh/article.md'), /calc\(12px/)
  assert.doesNotMatch(compile(css, '/project/node_modules/vendor/ui.css'), /calc\(12px/)
})

test('icons scale but touch controls and explicit input font floors never shrink', () => {
  const output = compile('.tool-icon{width:24px;height:24px}button{height:36px;min-width:36px}input{font-size:16px;height:30px} .submit{height:36px;min-height:36px;line-height:20px}')
  assert.match(output, /width: calc\(24px \* var\(--site-ui-scale\)\)/)
  assert.match(output, /height: max\(36px, calc\(36px \* var\(--site-ui-scale\)\)\)/)
  assert.match(output, /min-width: max\(36px, calc\(36px \* var\(--site-ui-scale\)\)\)/)
  assert.match(output, /font-size: max\(16px, calc\(16px \* var\(--site-ui-scale\)\)\)/)
})

test('media sizes, layout bounds, borders, coordinates and ancestor icons are not mistaken for control metrics', () => {
  const output = compile('.panel{width:300px;height:400px;max-height:500px}.preview img{width:640px;height:480px}.icon-btn .panel{width:200px;height:100px}button::before{inset:-4px 0;border:1px solid red} .tool-icon{top:12px;transform:translateX(18px)}')
  for (const size of [300, 400, 500, 640, 480, 200, 100])
    assert.ok(output.includes(`${size}px`))
  assert.doesNotMatch(output, /--site-ui-scale/)
})

test('nested and media rules preserve their own source and selector context', () => {
  const output = compile('@media(max-width:959px){.toolbar{input{font-size:16px}.tool-icon{width:12px;height:12px}}}.profile{--forum-topic-lifecycle-icon-size:14px}.empty{font-size:0px}')
  assert.match(output, /width <= 959px/)
  assert.match(output, /font-size: max\(16px/)
  assert.match(output, /width: calc\(12px/)
  assert.match(output, /--forum-topic-lifecycle-icon-size: calc\(14px/)
  assert.doesNotMatch(output, /calc\(0px/)
})
