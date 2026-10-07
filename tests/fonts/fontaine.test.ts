import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { loadFontSubsetConfig } from '../../scripts/font_subset/config'
import { generateFontaineFallbackCss } from '../../scripts/font_subset/fontaine'

const projectRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))

test('generates one stable Fontaine fallback set per font family and weight', async () => {
  const config = loadFontSubsetConfig()
  const css = await generateFontaineFallbackCss(projectRoot)
  const fontFaces = css.match(/@font-face\s*\{[^}]*\}/g) ?? []

  assert.equal(
    fontFaces.length,
    config.fonts.length * config.fontaine.fallbacks.length,
  )

  const variables = readFileSync(
    resolve(projectRoot, '.vitepress/theme/styles/vp-vars.css'),
    'utf8',
  )
  for (const font of config.fonts) {
    const fallbackFamily = `${font.cssFamily} ${config.fontaine.fallbackNameSuffix}`
    const familyFaces = fontFaces.filter(rule => (
      rule.includes(`font-family: "${fallbackFamily}"`)
      && rule.includes(`font-weight: ${font.fontWeight};`)
    ))

    assert.equal(familyFaces.length, config.fontaine.fallbacks.length)
    assert.ok(variables.includes(`'${fallbackFamily}'`))
    assert.ok(familyFaces.every(rule => rule.includes(`font-weight: ${font.fontWeight};`)))
    for (const fallback of config.fontaine.fallbacks) {
      assert.equal(
        familyFaces.filter(rule => rule.includes(`src: local("${fallback}")`)).length,
        1,
      )
    }
  }
})
