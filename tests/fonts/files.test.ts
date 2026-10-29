import { strict as assert } from 'node:assert'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import MarkdownIt from 'markdown-it'
import { afterAll, test } from 'vitest'
import { loadFontSubsetConfig } from '../../scripts/font_subset/config'
import { collectSiteCodepoints } from '../../scripts/font_subset/files'
import { calculateFontInputHashes } from '../../scripts/font_subset/inputs'

const fixtureRoot = mkdtempSync(join(tmpdir(), 'font-subset-extractor-'))
const sourceDir = join(fixtureRoot, 'src')
mkdirSync(sourceDir)

afterAll(() => rmSync(fixtureRoot, { recursive: true, force: true }))

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

  const base = textFor('sarasa_gothic_sc')
  for (const weight of ['semibold', 'bold'])
    assert.equal(textFor(`sarasa_gothic_sc_${weight}`), base)
  for (const character of '丙戊壬子辰丑寅庚')
    assert.match(base, new RegExp(character))
  for (const character of '甲乙丁己辛癸卯')
    assert.doesNotMatch(base, new RegExp(character))

  const subtitle = textFor('hywenhei_65w')
  for (const character of '甲乙丙丁己辛癸丑寅卯')
    assert.match(subtitle, new RegExp(character))
  for (const character of '戊壬子辰庚')
    assert.doesNotMatch(subtitle, new RegExp(character))

  const title = textFor('hywenhei_85w')
  for (const character of '甲丁辛卯')
    assert.match(title, new RegExp(character))
  for (const character of '乙丙戊己庚壬癸子丑寅辰')
    assert.doesNotMatch(title, new RegExp(character))
})

test('locale YAML contributes nested and multiline text and invalidates only the site cache', async () => {
  const config = loadFontSubsetConfig()
  const localeScan = config.scan.find(entry => entry.path === '.vitepress/locales')!
  assert.ok(localeScan.extensions.includes('.yml'))
  const root = mkdtempSync(join(tmpdir(), 'font-yaml-'))
  try {
    const directory = join(root, '.vitepress/locales/ja')
    mkdirSync(directory, { recursive: true })
    const file = join(directory, 'forum.yml')
    writeFileSync(file, 'description: 絞り込み\nitems:\n  - |\n    解決済み\n')
    config.scan = [localeScan]
    const before = await collectSiteCodepoints(root, config, new MarkdownIt())
    for (const character of '絞済')
      assert.ok(before.sarasa_gothic_sc.includes(character.codePointAt(0)!))
    const hashes = calculateFontInputHashes(process.cwd(), config, before)
    writeFileSync(file, 'description: 絞り込み\nitems:\n  - |\n    解決済み\n    遷移\n')
    const after = await collectSiteCodepoints(root, config, new MarkdownIt())
    assert.ok(after.sarasa_gothic_sc.includes('遷'.codePointAt(0)!))
    const changed = calculateFontInputHashes(process.cwd(), config, after)
    assert.equal(changed.standardHash, hashes.standardHash)
    assert.notEqual(changed.siteHash, hashes.siteHash)
  }
  finally {
    rmSync(root, { recursive: true, force: true })
  }
})
