import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import MarkdownIt from 'markdown-it'
import { afterEach, test } from 'vitest'
import { FontArtifacts } from '../../scripts/font_subset/artifacts'
import { loadFontSubsetConfig, resolveFontSubsetPaths } from '../../scripts/font_subset/config'
import { collectSiteCodepoints } from '../../scripts/font_subset/files'
import { calculateFontInputHashes } from '../../scripts/font_subset/inputs'

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true })
})

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'font-cache-inputs-'))
  roots.push(root)
  const config = loadFontSubsetConfig()
  config.scan = [{ path: 'src', extensions: ['.json'] }]
  const paths = resolveFontSubsetPaths(root, config)
  for (const file of [paths.pythonEntry, paths.requirements, ...config.fonts.map(font => join(paths.sourceDir, font.sourceFile))]) {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, 'original input\n')
  }
  mkdirSync(paths.pythonPackage, { recursive: true })
  writeFileSync(join(paths.pythonPackage, 'pipeline.py'), 'original pipeline\n')
  mkdirSync(join(root, 'src'), { recursive: true })
  const data = join(root, 'src', 'members.json')
  writeFileSync(data, JSON.stringify({ text: '甲', lastUpdated: 1 }))
  const hashes = async () => calculateFontInputHashes(root, config, await collectSiteCodepoints(root, config, new MarkdownIt()))
  return { root, config, paths, data, hashes }
}

test('cache signatures follow character sets after data refresh, not timestamps or duplicate text', async () => {
  const { data, hashes } = fixture()
  const before = await hashes()
  writeFileSync(data, JSON.stringify({ lastUpdated: 987654321, text: '甲甲' }))
  assert.deepEqual(await hashes(), before)
  writeFileSync(data, JSON.stringify({ text: '甲龘', lastUpdated: 987654321 }))
  const changed = await hashes()
  assert.equal(changed.standardHash, before.standardHash)
  assert.notEqual(changed.siteHash, before.siteHash)
})

test.each(['pythonEntry', 'requirements', 'source', 'pipeline'] as const)('cache signatures invalidate when %s changes', async (input) => {
  const { config, paths, hashes } = fixture()
  const before = await hashes()
  const file = input === 'source'
    ? join(paths.sourceDir, config.fonts[0]!.sourceFile)
    : input === 'pipeline' ? join(paths.pythonPackage, 'pipeline.py') : paths[input]
  writeFileSync(file, `${readFileSync(file, 'utf8')}changed\n`)
  const after = await hashes()
  assert.notEqual(after.standardHash, before.standardHash)
  assert.notEqual(after.siteHash, before.siteHash)
})

test('site-only generation settings keep the standard fallback signature', async () => {
  const { config, hashes } = fixture()
  const before = await hashes()
  config.chunking.siteTargetBytes += 1
  const after = await hashes()
  assert.equal(after.standardHash, before.standardHash)
  assert.notEqual(after.siteHash, before.siteHash)
})

test('artifact validation rejects mismatched, missing and corrupted cached files', () => {
  const { root, config, paths } = fixture()
  config.fonts = [{ ...config.fonts[0]!, scriptTiers: ['latin'], standardTiers: ['l1'] }]
  mkdirSync(paths.fontsDir, { recursive: true })
  const stem = config.fonts[0]!.fileStem
  const face = (group: string) => {
    const bytes = Buffer.from(group)
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, config.hashing.fileNameLength)
    const file = `${stem}.${group}.01.${hash}.woff2`
    writeFileSync(join(paths.fontsDir, file), bytes)
    return { file, css: `@font-face { src: url('./${file}'); unicode-range: U+4E00; }` }
  }
  const site = face('cjk.min')
  const latin = face('latin')
  const cjk = face('cjk.l1')
  const standardHash = 'a'.repeat(64)
  const siteHash = 'b'.repeat(64)
  writeFileSync(paths.siteCssFile, `/* font-subset-site: ${siteHash} */\n${site.css}`)
  writeFileSync(paths.standardCssFile, `/* font-subset-standard: ${standardHash} */\n${latin.css}\n${cjk.css}`)
  const artifacts = new FontArtifacts(config, resolveFontSubsetPaths(root, config))
  assert.equal(artifacts.isCurrent(standardHash, siteHash), true)
  assert.equal(artifacts.isCurrent(standardHash, 'c'.repeat(64)), false)
  assert.equal(artifacts.standardIsCurrent('c'.repeat(64)), false)
  writeFileSync(join(paths.fontsDir, site.file), 'corrupt cache')
  assert.equal(artifacts.isCurrent(standardHash, siteHash), false)
  assert.equal(artifacts.standardIsCurrent(standardHash), true)
  unlinkSync(join(paths.fontsDir, latin.file))
  assert.equal(artifacts.standardIsCurrent(standardHash), false)
})
