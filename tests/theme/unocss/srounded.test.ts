import assert from 'node:assert/strict'
import { createGenerator, presetWind4 } from 'unocss'
import { test } from 'vitest'
import { sroundedRules } from '../../../.vitepress/theme/unocss/srounded'

test('smooth corner utilities preserve fallback, variants and pill geometry', async () => {
  const uno = await createGenerator({ presets: [presetWind4()], rules: sroundedRules })
  const { css, matched } = await uno.generate('srounded-[16px] srounded-lg hover:srounded-t-[12px] srounded-ss-sm srounded-none srounded-full srounded-[var(--compact-radius)] data-[vaul-drawer-direction=bottom]:srounded-t-[var(--compact-radius)]')
  assert.equal(matched.size, 8)
  assert.match(css, /border-radius:16px/)
  assert.match(css, /@supports \(corner-shape: superellipse\(1\)\)/)
  assert.match(css, /superellipse\(var\(--srounded-n, 1\.6\)\)/)
  assert.match(css, /calc\(16px \* var\(--srounded-scale, 1\.6\)\)/)
  assert.match(css, /:hover\{border-top-left-radius:12px;border-top-right-radius:12px/)
  assert.match(css, /border-start-start-radius:/)
  assert.match(css, /\.srounded-full\{border-radius:9999px/)
  assert.match(css, /\.srounded-none\{border-radius:0/)
  assert.match(css, /corner-shape:round/)
  assert.match(css, /border-radius:var\(--compact-radius\)/)
  assert.match(css, /\[data-vaul-drawer-direction="?bottom"?\]/)
})
