import type ForumAPI from '~/forum/api/forum'
import { isCategoryLabel } from './forumLabel'

const TOPIC_TYPE_LABEL = /^TYP-(?:ANN|BUG|FEAT)$/

export function replaceTopicTypeLabel(
  labels: readonly string[],
  type: ForumAPI.FeedbackTopicType,
): string[] {
  return uniqueLabels([...labels.filter(label => !TOPIC_TYPE_LABEL.test(label)), `TYP-${type}`])
}

export function buildTopicCreationLabels(
  type: ForumAPI.FeedbackTopicType,
  sourceLabel: string,
  localeLabel: string | null | undefined,
  tags: readonly string[],
): string[] {
  return replaceTopicTypeLabel([sourceLabel, ...(localeLabel ? [localeLabel] : []), ...tags], type)
}

export function replaceEditableTopicLabels(labels: readonly string[], editableLabels: readonly string[]): string[] {
  return uniqueLabels([
    ...labels.filter(label => !isCategoryLabel(label)),
    ...editableLabels.filter(isCategoryLabel),
  ])
}

export function getEditableTopicLabels(labels: readonly string[]): string[] {
  return labels.filter(isCategoryLabel)
}

export function toggleTopicLabel(labels: readonly string[], label: string, enabled: boolean): string[] {
  return uniqueLabels(enabled ? [...labels, label] : labels.filter(value => value !== label))
}

export function parseTopicLabels(value: string): string[] {
  return uniqueLabels(value.split(',').map(label => label.trim()).filter(Boolean))
}

function uniqueLabels(labels: readonly string[]): string[] {
  return [...new Set(labels)]
}
