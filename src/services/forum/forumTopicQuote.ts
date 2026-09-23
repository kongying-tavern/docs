import type ForumAPI from '~/services/forum/api'

export const QUOTED_TOPIC_ID_PARAM = 'quote-topic'
export const QUOTED_TOPIC_TYPE_PARAM = 'quote-type'

export const TOPIC_ID_PATTERN = 'I[A-Z0-9]{5,}'
export const TOPIC_ID_REGEX = new RegExp(`^${TOPIC_ID_PATTERN}$`, 'iu')
const QUOTABLE_TOPIC_TYPES = new Set<string>(['BUG', 'FEAT'])
const URL_ORIGIN = 'https://forum.invalid'

type QuotableTopicReference = ForumAPI.QuotedTopicReference & { type: 'BUG' | 'FEAT' }

interface HistoryWriter {
  readonly state: unknown
  replaceState: (data: unknown, unused: string, url?: string | URL | null) => void
}

export function normalizeQuotedTopicReference(value: unknown): QuotableTopicReference | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined

  const candidate = value as Partial<ForumAPI.QuotedTopicReference>
  const id = typeof candidate.id === 'string' ? candidate.id.trim().toUpperCase() : ''
  const type = typeof candidate.type === 'string' ? candidate.type.toUpperCase() : ''
  if (!TOPIC_ID_REGEX.test(id) || !isQuotableTopicType(type))
    return undefined

  return { id, type }
}

export function isQuotableTopicType(type: unknown): type is 'BUG' | 'FEAT' {
  return typeof type === 'string' && QUOTABLE_TOPIC_TYPES.has(type)
}

export function shouldShowQuotedTopicImageBelow(images?: readonly ForumAPI.ImageInfo[]): boolean {
  if (images?.length !== 1)
    return false

  const { width, height } = images[0]
  return Number(width) > 0 && Number(height) > 0 && Number(width) / Number(height) >= 4 / 3
}

export function readQuotedTopicRequest(input: string | URL): ForumAPI.QuotedTopicReference | undefined {
  const url = toUrl(input)
  return normalizeQuotedTopicReference({
    id: url.searchParams.get(QUOTED_TOPIC_ID_PARAM),
    type: url.searchParams.get(QUOTED_TOPIC_TYPE_PARAM),
  })
}

export function buildQuotedTopicFormHref(
  input: string | URL,
  reference: ForumAPI.QuotedTopicReference,
  formHash: string,
): string {
  const normalized = normalizeQuotedTopicReference(reference)
  if (!normalized)
    throw new RangeError('Invalid quoted Topic reference.')

  const url = toUrl(input)
  url.searchParams.set(QUOTED_TOPIC_ID_PARAM, normalized.id)
  url.searchParams.set(QUOTED_TOPIC_TYPE_PARAM, normalized.type)
  url.hash = `${formHash}-${normalized.type}`
  return toHref(url)
}

export function clearQuotedTopicRequest(history: HistoryWriter, input: string | URL): boolean {
  const url = toUrl(input)
  if (!url.searchParams.has(QUOTED_TOPIC_ID_PARAM) && !url.searchParams.has(QUOTED_TOPIC_TYPE_PARAM))
    return false

  url.searchParams.delete(QUOTED_TOPIC_ID_PARAM)
  url.searchParams.delete(QUOTED_TOPIC_TYPE_PARAM)
  history.replaceState(history.state, '', toHref(url))
  return true
}

function toUrl(input: string | URL): URL {
  return input instanceof URL ? new URL(input) : new URL(input, URL_ORIGIN)
}

function toHref(url: URL): string {
  return `${url.pathname}${url.search}${url.hash}`
}
