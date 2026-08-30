import type { TopicFormData } from './validation'
import { STORAGE_KEYS } from '../forumConfig'

/**
 * Legacy single-key draft storage used before drafts were split per topic type.
 * Kept only as a read fallback so existing drafts are migrated once.
 */
const LEGACY_DRAFT_KEY = STORAGE_KEYS.FORUM_FORM_DATA

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
  return {
    type: stored.type === 'FEAT' || stored.type === 'ANN' ? stored.type : 'BUG',
    title: typeof stored.title === 'string' ? stored.title : '',
    text: typeof stored.text === 'string' ? stored.text : '',
    tags: Array.isArray(stored.tags)
      ? stored.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
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
    localStorage.removeItem(LEGACY_DRAFT_KEY)
    return legacy
  }

  return createDefaultTopicDraft()
}

export function writeTopicDraft(type: TopicFormData['type'], draft: TopicFormData): void {
  if (typeof localStorage === 'undefined')
    return
  // The legacy key no longer needs to be consulted once a per-type draft exists.
  localStorage.removeItem(LEGACY_DRAFT_KEY)
  localStorage.setItem(getTopicDraftStorageKey(type), JSON.stringify(restoreTopicDraft(draft)))
}
