import { detectWithBrowser, translateWithBrowser } from './browserTranslation'
import { areLanguagesEquivalent, canonicalizeLanguage } from './forumLanguage'
import { prepareTerminology } from './forumTerminology'

export type TranslationProvider = 'browser' | 'passthrough'

export type LanguageDetectionResult
  = | {
    status: 'detected'
    language: string
    confidence?: number
    provider: 'browser' | 'metadata'
  }
  | {
    status: 'unknown'
    reason: 'short' | 'unreliable' | 'unavailable'
  }

export interface TranslationResult {
  text: string
  sourceLanguage: string
  targetLanguage: string
  provider: TranslationProvider
}

export type AutoTranslationResult
  = | ({ status: 'translated' } & TranslationResult)
    | { status: 'skipped', reason: 'short' | 'unreliable' | 'unavailable' | 'same-language' }

interface DetectionOptions {
  expectedLanguages?: string[]
  fallbackLanguage?: string | null
  signal?: AbortSignal
}

interface TranslationOptions {
  sourceLanguage?: string | null
  targetLanguage: string
  signal?: AbortSignal
}

interface AutoTranslationOptions extends Omit<TranslationOptions, 'sourceLanguage'> {
  sourceLanguage?: string | null
  expectedLanguages?: string[]
}

const MIN_DETECTION_CHARACTERS = 8
const MIN_CONFIDENCE = 0.55
const MIN_CONFIDENCE_GAP = 0.05
const MAX_TRANSLATION_CACHE = 150
const MEANINGFUL_CHARACTER_RE = /[\p{L}\p{N}]/gu
const translationCache = new Map<string, Promise<TranslationResult>>()

function meaningfulLength(text: string): number {
  return text.match(MEANINGFUL_CHARACTER_RE)?.length ?? 0
}

export async function detectLanguage(
  text: string,
  options: DetectionOptions = {},
): Promise<LanguageDetectionResult> {
  const fallbackLanguage = canonicalizeLanguage(options.fallbackLanguage)
  if (meaningfulLength(text) < MIN_DETECTION_CHARACTERS) {
    if (fallbackLanguage)
      return { status: 'detected', language: fallbackLanguage, provider: 'metadata' }
    return { status: 'unknown', reason: 'short' }
  }

  let browserReason: 'unreliable' | 'unavailable' = 'unavailable'
  try {
    const candidates = await detectWithBrowser(text, {
      expectedLanguages: options.expectedLanguages,
      signal: options.signal,
    })
    if (candidates) {
      const [first, second] = candidates
      const language = canonicalizeLanguage(first?.detectedLanguage)
      const reliable = language
        && language !== 'und'
        && (first?.confidence ?? 0) >= MIN_CONFIDENCE
        && (!second || first!.confidence - second.confidence >= MIN_CONFIDENCE_GAP)
      if (reliable)
        return { status: 'detected', language, confidence: first!.confidence, provider: 'browser' }
      browserReason = 'unreliable'
    }
  }
  catch {
    // 浏览器检测模型不可用时回退到元数据/未知
  }

  return fallbackLanguage
    ? { status: 'detected', language: fallbackLanguage, provider: 'metadata' }
    : { status: 'unknown', reason: browserReason }
}

export async function translate(text: string, options: TranslationOptions): Promise<TranslationResult> {
  const sourceLanguage = canonicalizeLanguage(options.sourceLanguage)
  const targetLanguage = canonicalizeLanguage(options.targetLanguage)
  if (!targetLanguage)
    throw new RangeError('A valid target language is required.')
  if (sourceLanguage && areLanguagesEquivalent(sourceLanguage, targetLanguage)) {
    return { text, sourceLanguage, targetLanguage, provider: 'passthrough' }
  }
  if (!sourceLanguage)
    throw new BrowserTranslationUnavailableError()

  const browserKey = JSON.stringify(['browser', sourceLanguage, targetLanguage, text])
  return cachedTranslation(browserKey, async () => {
    const terminology = await prepareTerminology(text, sourceLanguage, targetLanguage)
    const translated = await translateWithBrowser(terminology.text, {
      sourceLanguage,
      targetLanguage,
      signal: options.signal,
    })
    if (translated === null)
      throw new BrowserTranslationUnavailableError()
    return {
      text: terminology.restore(translated),
      sourceLanguage,
      targetLanguage,
      provider: 'browser',
    }
  }, options.signal)
}

export async function translateAuto(text: string, options: AutoTranslationOptions): Promise<AutoTranslationResult> {
  const detection = await detectLanguage(text, {
    expectedLanguages: options.expectedLanguages,
    fallbackLanguage: options.sourceLanguage,
    signal: options.signal,
  })
  if (detection.status === 'unknown')
    return { status: 'skipped', reason: detection.reason }

  const targetLanguage = canonicalizeLanguage(options.targetLanguage)
  if (!targetLanguage)
    return { status: 'skipped', reason: 'unavailable' }
  if (areLanguagesEquivalent(detection.language, targetLanguage))
    return { status: 'skipped', reason: 'same-language' }

  const translated = await translate(text, {
    sourceLanguage: detection.language,
    targetLanguage,
    signal: options.signal,
  })
  if (translated.provider === 'passthrough')
    return { status: 'skipped', reason: 'same-language' }

  return {
    status: 'translated',
    ...translated,
  }
}

async function cachedTranslation(
  key: string,
  create: () => Promise<TranslationResult>,
  signal?: AbortSignal,
): Promise<TranslationResult> {
  const cached = translationCache.get(key)
  if (cached) {
    translationCache.delete(key)
    translationCache.set(key, cached)
    return cached
  }

  const pending = create()
  if (signal) {
    const result = await pending
    translationCache.set(key, Promise.resolve(result))
    trimTranslationCache()
    return result
  }

  translationCache.set(key, pending)
  pending.catch(() => {
    if (translationCache.get(key) === pending)
      translationCache.delete(key)
  })
  trimTranslationCache()
  return pending
}

function trimTranslationCache(): void {
  while (translationCache.size > MAX_TRANSLATION_CACHE) {
    const oldest = translationCache.keys().next().value as string | undefined
    if (!oldest)
      return
    translationCache.delete(oldest)
  }
}

class BrowserTranslationUnavailableError extends Error {}
