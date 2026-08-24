import type { TopicFormData } from '../../utils/validation'

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
