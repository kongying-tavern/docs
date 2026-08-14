/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this build script */
import { strict as assert } from 'node:assert'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import MarkdownIt from 'markdown-it'
import { loadFontSubsetConfig } from './config'
import { collectSiteCodepoints } from './files'

const fixtureRoot = mkdtempSync(join(tmpdir(), 'font-subset-extractor-'))
const sourceDir = join(fixtureRoot, 'src')
mkdirSync(sourceDir)

after(() => rmSync(fixtureRoot, { recursive: true, force: true }))

test('assigns structured site text to configured font roles', async () => {
  writeFileSync(join(sourceDir, 'page.md'), [
    '---',
    'title: 甲',
    'hero:',
    '  tagline: 乙',
    'misc: 丙',
    '---',
    '# 丁',
    '正文戊',
    '## 己',
    '**庚**',
    '<div class="title">卯</div>',
    '<p>辰</p>',
  ].join('\n'))
  writeFileSync(join(sourceDir, 'Widget.vue'), [
    '<template>',
    '  <h1>辛</h1>',
    '  <p>壬</p>',
    '  <div class="font-[var(--vp-font-family-subtitle)]">癸</div>',
    '  <p>{{ \'子\' }}</p>',
    '</template>',
    '<script setup lang="ts">',
    'const label = \'丑\'',
    '</script>',
  ].join('\n'))
  writeFileSync(join(sourceDir, 'labels.ts'), 'export const label = \'寅\'\n')

  const config = loadFontSubsetConfig()
  config.scan = [{
    path: 'src',
    extensions: ['.md', '.ts', '.vue'],
  }]
  const result = await collectSiteCodepoints(fixtureRoot, config, new MarkdownIt({ html: true }))
  const textFor = (font: string): string => String.fromCodePoint(...result[font])

  const base = textFor('hywenhei_45w')
  for (const character of '甲乙丙丁戊己庚辛壬癸子丑寅卯辰')
    assert.match(base, new RegExp(character))

  const subtitle = textFor('hywenhei_65w')
  for (const character of '甲乙丙丁己庚辛癸丑寅卯')
    assert.match(subtitle, new RegExp(character))
  for (const character of '戊壬子辰')
    assert.doesNotMatch(subtitle, new RegExp(character))

  const title = textFor('hywenhei_85w')
  for (const character of '甲丁辛卯')
    assert.match(title, new RegExp(character))
  for (const character of '乙丙戊己庚壬癸子丑寅辰')
    assert.doesNotMatch(title, new RegExp(character))
})
