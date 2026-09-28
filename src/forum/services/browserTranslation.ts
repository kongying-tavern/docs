type Availability = 'available' | 'downloadable' | 'downloading' | 'unavailable'

interface DownloadProgressEvent extends Event {
  loaded: number
}

interface CreateMonitor {
  addEventListener: (type: 'downloadprogress', listener: (event: DownloadProgressEvent) => void) => void
}

interface DetectionCandidate {
  detectedLanguage: string
  confidence: number
}

interface BrowserLanguageDetector {
  inputQuota: number
  measureInputUsage: (text: string, options?: { signal?: AbortSignal }) => Promise<number>
  detect: (text: string, options?: { signal?: AbortSignal }) => Promise<DetectionCandidate[]>
  destroy: () => void
}

interface BrowserTranslator {
  inputQuota: number
  measureInputUsage: (text: string, options?: { signal?: AbortSignal }) => Promise<number>
  translate: (text: string, options?: { signal?: AbortSignal }) => Promise<string>
  destroy: () => void
}

interface LanguageDetectorApi {
  availability: (options?: { expectedInputLanguages?: string[] }) => Promise<Availability>
  create: (options?: {
    expectedInputLanguages?: string[]
    monitor?: (monitor: CreateMonitor) => void
  }) => Promise<BrowserLanguageDetector>
}

interface TranslatorApi {
  availability: (options: { sourceLanguage: string, targetLanguage: string }) => Promise<Availability>
  create: (options: {
    sourceLanguage: string
    targetLanguage: string
    monitor?: (monitor: CreateMonitor) => void
  }) => Promise<BrowserTranslator>
}

interface BrowserAiScope {
  LanguageDetector?: LanguageDetectorApi
  Translator?: TranslatorApi
}

interface TranslatorRecord {
  translator: BrowserTranslator
  queue: Promise<void>
}

const MAX_TRANSLATORS = 4
const MAX_DETECTORS = 2
const translatorRecords = new Map<string, Promise<TranslatorRecord>>()
const detectorPromises = new Map<string, Promise<BrowserLanguageDetector>>()

function browserAi(): BrowserAiScope {
  return globalThis as unknown as BrowserAiScope
}

export function isBrowserTranslationSupported(): boolean {
  const api = browserAi()
  return typeof window !== 'undefined' && Boolean(api.LanguageDetector && api.Translator)
}

function canCreate(availability: Availability): boolean {
  // 模型未就绪（downloadable/downloading）时也尝试 create：下载由浏览器后台完成，
  // 失败会 reject 回落 remote；仅 unavailable 才放弃原生路径
  return availability !== 'unavailable'
}

function monitorProgress(onProgress?: (progress: number) => void) {
  if (!onProgress)
    return undefined
  return (monitor: CreateMonitor) => {
    monitor.addEventListener('downloadprogress', event => onProgress(event.loaded))
  }
}

async function ensureQuota(
  instance: Pick<BrowserLanguageDetector, 'inputQuota' | 'measureInputUsage'>,
  text: string,
  signal?: AbortSignal,
): Promise<void> {
  const usage = await instance.measureInputUsage(text, { signal })
  if (usage > instance.inputQuota)
    throw new DOMException('Browser translation input quota exceeded.', 'QuotaExceededError')
}

export async function detectWithBrowser(
  text: string,
  options: {
    expectedLanguages?: string[]
    signal?: AbortSignal
    onProgress?: (progress: number) => void
  } = {},
): Promise<DetectionCandidate[] | null> {
  const api = browserAi().LanguageDetector
  if (!api)
    return null

  const availability = await api.availability(
    options.expectedLanguages?.length
      ? { expectedInputLanguages: options.expectedLanguages }
      : undefined,
  )
  if (availability === 'unavailable' || !canCreate(availability))
    return null

  const key = JSON.stringify(options.expectedLanguages?.toSorted() ?? [])
  let detectorPromise = detectorPromises.get(key)
  if (detectorPromise) {
    detectorPromises.delete(key)
    detectorPromises.set(key, detectorPromise)
  }
  else {
    detectorPromise = api.create({
      expectedInputLanguages: options.expectedLanguages,
      monitor: monitorProgress(options.onProgress),
    })
    detectorPromises.set(key, detectorPromise)
    detectorPromise.catch(() => {
      if (detectorPromises.get(key) === detectorPromise)
        detectorPromises.delete(key)
    })
    evictDetectors()
  }

  const detector = await detectorPromise
  await ensureQuota(detector, text, options.signal)
  return detector.detect(text, { signal: options.signal })
}

function evictDetectors(): void {
  while (detectorPromises.size > MAX_DETECTORS) {
    const oldest = detectorPromises.entries().next().value as [string, Promise<BrowserLanguageDetector>] | undefined
    if (!oldest)
      return
    detectorPromises.delete(oldest[0])
    oldest[1].then(detector => detector.destroy()).catch(() => undefined)
  }
}

export async function translateWithBrowser(
  text: string,
  options: {
    sourceLanguage: string
    targetLanguage: string
    signal?: AbortSignal
    onProgress?: (progress: number) => void
  },
): Promise<string | null> {
  const api = browserAi().Translator
  if (!api)
    return null

  const pair = {
    sourceLanguage: options.sourceLanguage,
    targetLanguage: options.targetLanguage,
  }
  const availability = await api.availability(pair)
  if (availability === 'unavailable' || !canCreate(availability))
    return null

  const key = JSON.stringify([pair.sourceLanguage, pair.targetLanguage])
  let recordPromise = translatorRecords.get(key)
  if (recordPromise) {
    translatorRecords.delete(key)
    translatorRecords.set(key, recordPromise)
  }
  else {
    recordPromise = api.create({
      ...pair,
      monitor: monitorProgress(options.onProgress),
    }).then(translator => ({ translator, queue: Promise.resolve() }))
    translatorRecords.set(key, recordPromise)
    recordPromise.catch(() => {
      if (translatorRecords.get(key) === recordPromise)
        translatorRecords.delete(key)
    })
    evictTranslators()
  }

  const record = await recordPromise
  const operation = record.queue.then(async () => {
    await ensureQuota(record.translator, text, options.signal)
    return record.translator.translate(text, { signal: options.signal })
  })
  record.queue = operation.then(() => undefined, () => undefined)
  return operation
}

function evictTranslators(): void {
  while (translatorRecords.size > MAX_TRANSLATORS) {
    const oldest = translatorRecords.entries().next().value as [string, Promise<TranslatorRecord>] | undefined
    if (!oldest)
      return
    translatorRecords.delete(oldest[0])
    oldest[1].then(record => record.translator.destroy()).catch(() => undefined)
  }
}
