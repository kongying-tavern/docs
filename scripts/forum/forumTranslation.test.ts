/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import assert from 'node:assert/strict'
import test from 'node:test'
import { matchLanguages } from '../../.vitepress/theme/composables/matchLanguages'
import { areLanguagesEquivalent } from '../../src/services/forum/forumLanguage'
import { prepareTerminology } from '../../src/services/forum/forumTerminology'
import { detectLanguage, translate, translateAuto } from '../../src/services/forum/forumTranslation'

test('automatic translation stays conservative without reliable language evidence', async () => {
  assert.deepEqual(
    await detectLanguage('Hi'),
    { status: 'unknown', reason: 'short' },
  )
  assert.deepEqual(
    await detectLanguage('This sentence is long enough for language detection.'),
    { status: 'unknown', reason: 'unavailable' },
  )
})

test('metadata is canonicalized and same-language text is not translated', async () => {
  assert.deepEqual(
    await detectLanguage('これは言語判定に十分な長さを持つ日本語の文章です。', {
      fallbackLanguage: 'JA-jp',
    }),
    { status: 'detected', language: 'ja-JP', provider: 'metadata' },
  )
  assert.deepEqual(
    await translateAuto('This sentence is already written in the requested language.', {
      sourceLanguage: 'EN-us',
      targetLanguage: 'en-US',
    }),
    { status: 'skipped', reason: 'same-language' },
  )
  assert.equal(areLanguagesEquivalent('zh-CN', 'zh'), true)
  assert.equal(areLanguagesEquivalent('zh-TW', 'zh-Hans'), false)
})

test('known metadata allows short feedback to translate without guessing', async () => {
  assert.deepEqual(
    await detectLanguage('Short text', { fallbackLanguage: 'en-US' }),
    { status: 'detected', language: 'en-US', provider: 'metadata' },
  )
})

test('browser language preference wins and page language remains the fallback', () => {
  const supported = ['zh', 'en', 'ja']
  assert.equal(matchLanguages(supported, ['en-US', 'zh-CN']), 'en')
  assert.equal(matchLanguages(supported, ['fr-FR']) ?? 'ja', 'ja')
})

test('terminology data stays lazy and protects exact and fuzzy matches', async () => {
  const originalFetch = globalThis.fetch
  let fetchCount = 0
  globalThis.fetch = async () => {
    fetchCount++
    return new Response(JSON.stringify([
      { en: 'Paimon', zhCN: '派蒙' },
      { en: 'Elemental Burst', zhCN: '元素爆发' },
      { en: 'Powerful Elemental Burst', zhCN: '强力元素爆发' },
    ]))
  }

  try {
    await translate('Paimon', { sourceLanguage: 'en', targetLanguage: 'en-US' })
    assert.equal(fetchCount, 0)

    const prepared = await prepareTerminology(
      'Paimon uses an Elementel Burst.',
      'en-US',
      'zh-CN',
    )
    assert.equal(fetchCount, 1)
    assert.doesNotMatch(prepared.text, /Paimon|Elementel Burst/)
    assert.equal(
      prepared.restore(`Translated: ${prepared.text}`),
      'Translated: 派蒙 uses an 元素爆发.',
    )
  }
  finally {
    globalThis.fetch = originalFetch
  }
})

test('native detection and translation handle text without metadata', async () => {
  const scope = globalThis as Record<string, unknown>
  Reflect.set(scope, 'window', scope)
  Reflect.set(scope, 'LanguageDetector', {
    availability: async () => 'available',
    create: async () => ({
      inputQuota: 1_000,
      measureInputUsage: async (text: string) => text.length,
      detect: async () => [
        { detectedLanguage: 'en', confidence: 0.9 },
        { detectedLanguage: 'fr', confidence: 0.1 },
      ],
      destroy: () => {},
    }),
  })
  Reflect.set(scope, 'Translator', {
    availability: async () => 'available',
    create: async () => ({
      inputQuota: 1_000,
      measureInputUsage: async (text: string) => text.length,
      translate: async () => '翻訳済み',
      destroy: () => {},
    }),
  })

  try {
    assert.deepEqual(
      await translateAuto('This sentence is long enough to identify as English.', { targetLanguage: 'ja' }),
      {
        status: 'translated',
        text: '翻訳済み',
        sourceLanguage: 'en',
        targetLanguage: 'ja',
        provider: 'browser',
      },
    )
  }
  finally {
    Reflect.deleteProperty(scope, 'Translator')
    Reflect.deleteProperty(scope, 'LanguageDetector')
    Reflect.deleteProperty(scope, 'window')
  }
})
