import type { Searcher as FastSearcher, FullOptions, MatchData } from 'fast-fuzzy'
import { canonicalizeLanguage } from './forumLanguage'

type GlossaryLanguage = 'en' | 'ja' | 'zhCN' | 'zhTW'

interface GlossaryEntry {
  en?: string
  ja?: string
  zhCN?: string
  zhTW?: string
}

interface IndexedTerm {
  normalized: string
  target: string
  wordCount: number
  characterCount: number
}

interface WordSegment {
  segment: string
  index: number
  end: number
}

interface TerminologyProcessor {
  apply: (text: string) => PreparedTerminology
}

export interface PreparedTerminology {
  text: string
  restore: (translated: string) => string
}

type TermSearcher = FastSearcher<IndexedTerm, FullOptions<IndexedTerm>>

const GLOSSARY_URL = new URL('./data/words.min.json', import.meta.url)
const PLACEHOLDER_START = 0xE000
const PLACEHOLDER_END = 0xF8FF
const MIN_FUZZY_CHARACTERS = 5
const FUZZY_SCORE_MARGIN = 0.06
const processorPromises = new Map<string, Promise<TerminologyProcessor>>()
let glossaryPromise: Promise<GlossaryEntry[]> | undefined

export async function prepareTerminology(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<PreparedTerminology> {
  const source = toGlossaryLanguage(sourceLanguage)
  const target = toGlossaryLanguage(targetLanguage)
  if (!source || !target || source === target)
    return identityPreparation(text)

  try {
    const processor = await getProcessor(source, target)
    return processor.apply(text)
  }
  catch {
    return identityPreparation(text)
  }
}

async function getProcessor(
  sourceLanguage: GlossaryLanguage,
  targetLanguage: GlossaryLanguage,
): Promise<TerminologyProcessor> {
  const key = `${sourceLanguage}:${targetLanguage}`
  const cached = processorPromises.get(key)
  if (cached)
    return cached

  const pending = Promise.all([loadGlossary(), import('fast-fuzzy')])
    .then(([entries, { Searcher }]) => createProcessor(entries, sourceLanguage, targetLanguage, Searcher))
  processorPromises.set(key, pending)
  pending.catch(() => {
    if (processorPromises.get(key) === pending)
      processorPromises.delete(key)
  })
  return pending
}

async function loadGlossary(): Promise<GlossaryEntry[]> {
  if (!glossaryPromise) {
    glossaryPromise = fetch(GLOSSARY_URL)
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`Terminology glossary request failed: ${response.status}`)
        const entries: unknown = await response.json()
        if (!Array.isArray(entries))
          throw new TypeError('Terminology glossary must be an array.')
        return entries as GlossaryEntry[]
      })
    glossaryPromise.catch(() => {
      glossaryPromise = undefined
    })
  }
  return glossaryPromise
}

function createProcessor(
  entries: GlossaryEntry[],
  sourceLanguage: GlossaryLanguage,
  targetLanguage: GlossaryLanguage,
  Searcher: typeof import('fast-fuzzy').Searcher,
): TerminologyProcessor {
  const segmenter = new Intl.Segmenter(localeFor(sourceLanguage), { granularity: 'word' })
  const exactTerms = new Map<number, Map<string, IndexedTerm>>()
  const termsByShape = new Map<number, Map<number, IndexedTerm[]>>()
  let maximumWordCount = 0

  for (const entry of entries) {
    const source = entry[sourceLanguage]?.trim()
    const target = entry[targetLanguage]?.trim()
    if (!source || !target)
      continue

    const words = segmentWords(source, segmenter)
    const normalized = normalizeWords(words)
    if (!normalized)
      continue

    const term: IndexedTerm = {
      normalized,
      target,
      wordCount: words.length,
      characterCount: characterCount(normalized),
    }
    const exactBucket = getOrCreate(exactTerms, term.wordCount, () => new Map())
    if (exactBucket.has(normalized))
      continue

    exactBucket.set(normalized, term)
    const lengthBuckets = getOrCreate(termsByShape, term.wordCount, () => new Map())
    getOrCreate(lengthBuckets, term.characterCount, () => []).push(term)
    maximumWordCount = Math.max(maximumWordCount, term.wordCount)
  }

  const searchers = new Map<number, Map<number, TermSearcher>>()
  for (const [wordCount, lengthBuckets] of termsByShape) {
    const searchersByLength = new Map<number, TermSearcher>()
    for (const [length, terms] of lengthBuckets) {
      searchersByLength.set(length, new Searcher<IndexedTerm, FullOptions<IndexedTerm>>(terms, {
        keySelector: term => term.normalized,
        ignoreCase: false,
        ignoreSymbols: false,
        normalizeWhitespace: false,
        returnMatchData: true,
        useSellers: false,
      }))
    }
    searchers.set(wordCount, searchersByLength)
  }

  return {
    apply(text: string): PreparedTerminology {
      const words = segmentWords(text, segmenter)
      const matches: Array<{ start: number, end: number, target: string }> = []

      for (let index = 0; index < words.length;) {
        const remaining = words.length - index
        const maximumLength = Math.min(maximumWordCount, remaining)
        let match: { term: IndexedTerm, wordCount: number } | undefined

        for (let wordCount = maximumLength; wordCount >= 1; wordCount--) {
          const normalized = normalizeWords(words.slice(index, index + wordCount))
          const exact = exactTerms.get(wordCount)?.get(normalized)
          if (exact) {
            match = { term: exact, wordCount }
            break
          }
        }

        if (!match) {
          match = findFuzzyMatch(words, index, maximumLength, searchers)
        }

        if (!match) {
          index++
          continue
        }

        const first = words[index]!
        const last = words[index + match.wordCount - 1]!
        matches.push({ start: first.index, end: last.end, target: match.term.target })
        index += match.wordCount
      }

      return replaceMatches(text, matches)
    },
  }
}

function findFuzzyMatch(
  words: WordSegment[],
  start: number,
  maximumWordCount: number,
  searchers: Map<number, Map<number, TermSearcher>>,
): { term: IndexedTerm, wordCount: number } | undefined {
  const candidates: Array<MatchData<IndexedTerm> & { wordCount: number }> = []

  for (let wordCount = maximumWordCount; wordCount >= 1; wordCount--) {
    const normalized = normalizeWords(words.slice(start, start + wordCount))
    const length = characterCount(normalized)
    if (length < MIN_FUZZY_CHARACTERS)
      continue

    const threshold = length < 8 ? 0.9 : 0.86
    const byLength = searchers.get(wordCount)
    for (let candidateLength = length - 1; candidateLength <= length + 1; candidateLength++) {
      const searcher = byLength?.get(candidateLength)
      if (!searcher)
        continue
      const results = searcher.search(normalized, {
        returnMatchData: true,
        threshold,
      }) as MatchData<IndexedTerm>[]
      for (const result of results.slice(0, 2))
        candidates.push({ ...result, wordCount })
    }
  }

  candidates.sort((left, right) => right.score - left.score || right.wordCount - left.wordCount)
  const [best, second] = candidates
  if (!best || (second && best.score - second.score < FUZZY_SCORE_MARGIN))
    return undefined
  return { term: best.item, wordCount: best.wordCount }
}

function segmentWords(text: string, segmenter: Intl.Segmenter): WordSegment[] {
  return [...segmenter.segment(text)]
    .filter(segment => segment.isWordLike)
    .map(segment => ({
      segment: segment.segment,
      index: segment.index,
      end: segment.index + segment.segment.length,
    }))
}

function normalizeWords(words: WordSegment[]): string {
  return words
    .map(word => word.segment.normalize('NFKC').toLocaleLowerCase())
    .join(' ')
}

function characterCount(value: string): number {
  return [...value.replaceAll(' ', '')].length
}

function replaceMatches(
  text: string,
  matches: Array<{ start: number, end: number, target: string }>,
): PreparedTerminology {
  if (!matches.length)
    return identityPreparation(text)

  const replacements = new Map<string, string>()
  let output = ''
  let cursor = 0
  let placeholderCodePoint = PLACEHOLDER_START

  for (const match of matches) {
    while (placeholderCodePoint <= PLACEHOLDER_END && text.includes(String.fromCodePoint(placeholderCodePoint)))
      placeholderCodePoint++
    if (placeholderCodePoint > PLACEHOLDER_END)
      break

    const placeholder = String.fromCodePoint(placeholderCodePoint++)
    output += text.slice(cursor, match.start) + placeholder
    replacements.set(placeholder, match.target)
    cursor = match.end
  }
  output += text.slice(cursor)

  return {
    text: output,
    restore(translated: string): string {
      let restored = translated
      for (const [placeholder, target] of replacements)
        restored = restored.replaceAll(placeholder, target)
      return restored
    },
  }
}

function identityPreparation(text: string): PreparedTerminology {
  return { text, restore: translated => translated }
}

function toGlossaryLanguage(language: string): GlossaryLanguage | null {
  const canonical = canonicalizeLanguage(language)
  if (!canonical)
    return null

  const locale = new Intl.Locale(canonical).maximize()
  if (locale.language === 'en' || locale.language === 'ja')
    return locale.language
  if (locale.language === 'zh')
    return locale.script === 'Hant' ? 'zhTW' : 'zhCN'
  return null
}

function localeFor(language: GlossaryLanguage): string {
  if (language === 'zhCN')
    return 'zh-CN'
  if (language === 'zhTW')
    return 'zh-TW'
  return language
}

function getOrCreate<K, V>(map: Map<K, V>, key: K, create: () => V): V {
  const existing = map.get(key)
  if (existing)
    return existing
  const value = create()
  map.set(key, value)
  return value
}
