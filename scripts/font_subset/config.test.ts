/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this build script */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { configFile, loadFontSubsetConfig } from './config'
import { createFontBuildManifest } from './manifest'

test('loads character and slicing data from referenced JSON files', () => {
  const document = JSON.parse(readFileSync(configFile, 'utf8'))
  const projectRoot = resolve(dirname(configFile), '../..')
  const charactersFile = resolve(projectRoot, document.charactersFile)
  const characters = JSON.parse(readFileSync(charactersFile, 'utf8'))
  const slicingFile = resolve(projectRoot, characters.slicingFile)
  const slicing = JSON.parse(readFileSync(slicingFile, 'utf8'))
  const config = loadFontSubsetConfig()

  assert.equal(document.characters, undefined)
  assert.equal(config.charactersFile, document.charactersFile)
  assert.equal(config.characters.slicingFile, characters.slicingFile)
  assert.deepEqual(config.characters.slicing, slicing)
  assert.deepEqual(config.scripts, document.scripts)
})

test('normalizes only font-build inputs for Python', () => {
  const config = loadFontSubsetConfig()
  const manifest = createFontBuildManifest(config)

  assert.equal(manifest.version, 2)
  assert.equal(
    manifest.chunking.siteCharactersPerChunk,
    Math.floor(
      config.chunking.siteTargetBytes / config.chunking.estimatedBytesPerCharacter,
    ),
  )
  assert.deepEqual(
    manifest.characters.priorityBuckets,
    config.characters.slicing.priorityBuckets,
  )
  assert.deepEqual(manifest.scripts, config.scripts.sets)
  assert.deepEqual(manifest.fonts[0]!.scriptTiers, config.fonts[0]!.scriptTiers)
  assert.equal('siteExtraction' in manifest, false)
  assert.equal('siteRoles' in manifest.fonts[0]!, false)
})
