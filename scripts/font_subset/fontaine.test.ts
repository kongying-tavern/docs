/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this build script */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { loadFontSubsetConfig } from './config'
import { generateFontaineFallbackCss } from './fontaine'

const projectRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))

test('generates one stable Fontaine fallback set per font family', async () => {
  const config = loadFontSubsetConfig()
  const css = await generateFontaineFallbackCss(projectRoot)
  const fontFaces = css.match(/@font-face\s*\{[^}]*\}/g) ?? []
  const cssEntry = readFileSync(resolve(projectRoot, config.fontaine.cssEntry), 'utf8')

  assert.match(cssEntry, /@import ['"]\.\/fonts-subset\.css['"];/)
  assert.match(cssEntry, /@import ['"]\.\/fonts-standard\.css['"];/)
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
    ))

    assert.equal(familyFaces.length, config.fontaine.fallbacks.length)
    assert.ok(variables.includes(`'${fallbackFamily}'`))
    for (const fallback of config.fontaine.fallbacks) {
      assert.equal(
        familyFaces.filter(rule => rule.includes(`src: local("${fallback}")`)).length,
        1,
      )
    }
  }
})
