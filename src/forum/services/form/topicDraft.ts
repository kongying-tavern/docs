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
export type SavedTopicDraft = TopicFormData & { savedAt?: number }
export const TOPIC_DRAFT_CHANGE_EVENT = 'forum-topic-drafts-changed'

export interface TopicDraftBackup {
  version: 1
  sourceKey: string
  raw: string
  savedAt: number
}

function backupDraft(storage: Storage, sourceKey: string, raw: string | null): void {
  if (raw === null)
    return
  const backup: TopicDraftBackup = { version: 1, sourceKey, raw, savedAt: Date.now() }
  // Keep damaged bytes separately so subsequent autosaves cannot evict them.
  if (!parseStoredDraft(raw))
    storage.setItem(`${sourceKey}-corrupt-backup`, JSON.stringify(backup))
  // One previous raw snapshot per slot bounds storage while retaining malformed data.
  storage.setItem(`${sourceKey}-backup`, JSON.stringify(backup))
}

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

export function restoreTopicDraft(value: unknown): SavedTopicDraft {
  const fallback = createDefaultTopicDraft()
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return fallback

  const stored = value as Partial<SavedTopicDraft>
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
      ? stored.tags.filter(tag => typeof tag === 'string')
      : [],
    ...(stored.isPrivate === true ? { isPrivate: true } : {}),
    ...(quotedTopic ? { quotedTopic } : {}),
    ...(attachments.length ? { attachments } : {}),
    ...(typeof stored.savedAt === 'number' && Number.isFinite(stored.savedAt) && stored.savedAt > 0 ? { savedAt: stored.savedAt } : {}),
  }
}

function getTopicDraftStorageKey(type: TopicFormData['type']): string {
  return `${LEGACY_DRAFT_KEY}-${type.toLowerCase()}`
}

function parseStoredDraft(value: string | null): SavedTopicDraft | null {
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
export function readTopicDraft(type: TopicFormData['type']): SavedTopicDraft {
  let storage: Storage
  let legacy: SavedTopicDraft | null
  try {
    if (typeof localStorage === 'undefined')
      return createDefaultTopicDraft()
    storage = localStorage
    const stored = parseStoredDraft(storage.getItem(getTopicDraftStorageKey(type)))
    if (stored)
      return stored
    legacy = parseStoredDraft(storage.getItem(LEGACY_DRAFT_KEY))
  }
  catch {
    return createDefaultTopicDraft()
  }
  if (legacy && legacy.type === type) {
    try {
      backupDraft(storage, getTopicDraftStorageKey(type), storage.getItem(getTopicDraftStorageKey(type)))
      storage.setItem(getTopicDraftStorageKey(type), JSON.stringify(legacy))
      backupDraft(storage, LEGACY_DRAFT_KEY, storage.getItem(LEGACY_DRAFT_KEY))
      storage.removeItem(LEGACY_DRAFT_KEY)
    }
    catch {
      // Reading a valid draft does not require its migration to succeed.
    }
    return legacy
  }

  return createDefaultTopicDraft()
}

export function readSavedTopicDrafts(types: TopicFormData['type'][]): SavedTopicDraft[] {
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
  const key = getTopicDraftStorageKey(type)
  backupDraft(localStorage, key, localStorage.getItem(key))
  localStorage.setItem(key, JSON.stringify({ ...restoreTopicDraft(draft), type, savedAt: Date.now() }))
  try {
    // Only discard the matching legacy draft after its replacement is durable.
    const raw = localStorage.getItem(LEGACY_DRAFT_KEY)
    const legacy = parseStoredDraft(raw)
    if (legacy?.type === type) {
      backupDraft(localStorage, LEGACY_DRAFT_KEY, raw)
      localStorage.removeItem(LEGACY_DRAFT_KEY)
    }
  }
  catch {
    // Optional cleanup must not report an already committed draft as failed.
  }
  notifyDraftChange()
}

export function readTopicDraftBackup(type: TopicFormData['type'], kind: 'previous' | 'corrupt' = 'previous'): TopicDraftBackup | null {
  try {
    for (const key of [getTopicDraftStorageKey(type), LEGACY_DRAFT_KEY]) {
      const raw = localStorage.getItem(`${key}-${kind === 'corrupt' ? 'corrupt-' : ''}backup`)
      if (!raw)
        continue
      let value: unknown
      try {
        value = JSON.parse(raw)
      }
      catch {
        continue
      }
      if (!value || typeof value !== 'object')
        continue
      const backup = value as Partial<TopicDraftBackup>
      if (backup.version !== 1 || backup.sourceKey !== key || typeof backup.raw !== 'string' || typeof backup.savedAt !== 'number' || !Number.isFinite(backup.savedAt) || backup.savedAt <= 0)
        continue
      if (key === LEGACY_DRAFT_KEY && parseStoredDraft(backup.raw)?.type !== type)
        continue
      return backup as TopicDraftBackup
    }
  }
  catch {
    // Backup lookup must not prevent editing the current draft.
  }
  return null
}

export function readTopicDraftRaw(type: TopicFormData['type']): string | null {
  try {
    return localStorage.getItem(getTopicDraftStorageKey(type))
  }
  catch {
    return null
  }
}

export function canRestoreTopicDraftBackup(type: TopicFormData['type']): boolean {
  const backup = readTopicDraftBackup(type)
  return backup !== null && parseStoredDraft(backup.raw)?.type === type
}

export function restoreTopicDraftBackup(type: TopicFormData['type']): boolean {
  const backup = readTopicDraftBackup(type)
  const restored = backup ? parseStoredDraft(backup.raw) : null
  if (!restored || restored.type !== type)
    return false
  writeTopicDraft(type, restored)
  return true
}

export function removeTopicDraft(type: TopicFormData['type']): void {
  if (typeof localStorage === 'undefined')
    return
  localStorage.removeItem(getTopicDraftStorageKey(type))
  notifyDraftChange()
}
