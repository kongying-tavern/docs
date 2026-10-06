import type { TopicFormData } from './validation'
import { IMAGE_UPLOAD_POLICY, STORAGE_KEYS } from '../forumConfig'
import { decodeForumText } from '../forumContentCodec'
import { normalizeQuotedTopicReference } from '../forumTopicQuote'
import { draftImageSchema } from './validation'

/**
 * Legacy single-key draft storage used before drafts were split per topic type.
 * Kept only as a read fallback so existing drafts are migrated once.
 */
const LEGACY_DRAFT_KEY = STORAGE_KEYS.FORUM_FORM_DATA
export const TOPIC_DRAFT_CHANGE_EVENT = 'forum-topic-drafts-changed'

declare global {
  interface WindowEventMap {
    [TOPIC_DRAFT_CHANGE_EVENT]: Event
  }
}

function notifyDraftChange(): void {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event(TOPIC_DRAFT_CHANGE_EVENT))
}

export function createDefaultTopicDraft(): TopicFormData {
  return {
    type: 'BUG',
    title: '',
    tags: [],
    text: '',
  }
}

export function restoreTopicDraft(value: unknown): TopicFormData {
  const fallback = createDefaultTopicDraft()
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return fallback

  const stored = value as Partial<TopicFormData>
  const quotedTopic = normalizeQuotedTopicReference(stored.quotedTopic)
  const attachments = Array.isArray(stored.attachments)
    ? stored.attachments.flatMap((image) => {
        const result = draftImageSchema.safeParse(image)
        return result.success ? [result.data] : []
      }).slice(0, IMAGE_UPLOAD_POLICY.MAX_COUNT)
    : []
  return {
    type: stored.type === 'FEAT' || stored.type === 'ANN' ? stored.type : 'BUG',
    title: typeof stored.title === 'string' ? stored.title : '',
    text: typeof stored.text === 'string' ? stored.text : '',
    tags: Array.isArray(stored.tags)
      ? stored.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    ...(stored.isPrivate === true ? { isPrivate: true } : {}),
    ...(quotedTopic ? { quotedTopic } : {}),
    ...(attachments.length ? { attachments } : {}),
  }
}

function getTopicDraftStorageKey(type: TopicFormData['type']): string {
  return `${LEGACY_DRAFT_KEY}-${type.toLowerCase()}`
}

function parseStoredDraft(value: string | null): TopicFormData | null {
  if (!value)
    return null
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return null
    return restoreTopicDraft(parsed)
  }
  catch {
    return null
  }
}

/**
 * Read the stored draft for a specific type. Falls back to the legacy
 * single-key draft once (migration) when the per-type slot is empty.
 */
export function readTopicDraft(type: TopicFormData['type']): TopicFormData {
  if (typeof localStorage === 'undefined')
    return createDefaultTopicDraft()

  const stored = parseStoredDraft(localStorage.getItem(getTopicDraftStorageKey(type)))
  if (stored)
    return stored

  const legacy = parseStoredDraft(localStorage.getItem(LEGACY_DRAFT_KEY))
  if (legacy && legacy.type === type) {
    localStorage.setItem(getTopicDraftStorageKey(type), JSON.stringify(legacy))
    localStorage.removeItem(LEGACY_DRAFT_KEY)
    return legacy
  }

  return createDefaultTopicDraft()
}

export function readSavedTopicDrafts(types: TopicFormData['type'][]): TopicFormData[] {
  return types.flatMap((type) => {
    const draft = { ...readTopicDraft(type), type }
    const hasContent = draft.title.trim() || decodeForumText(draft.text).text.trim()
      || draft.tags.length || draft.quotedTopic || draft.attachments?.length
    return hasContent ? [draft] : []
  })
}

export function writeTopicDraft(type: TopicFormData['type'], draft: TopicFormData): void {
  if (typeof localStorage === 'undefined')
    return
  // The legacy key no longer needs to be consulted once a per-type draft exists.
  localStorage.removeItem(LEGACY_DRAFT_KEY)
  localStorage.setItem(getTopicDraftStorageKey(type), JSON.stringify(restoreTopicDraft(draft)))
  notifyDraftChange()
}

export function removeTopicDraft(type: TopicFormData['type']): void {
  if (typeof localStorage === 'undefined')
    return
  localStorage.removeItem(getTopicDraftStorageKey(type))
  notifyDraftChange()
}
