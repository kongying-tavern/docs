import type ForumAPI from '@/apis/forum/api'

const TOPIC_TYPE_LABEL = /^TYP-(?:ANN|BUG|FEAT)$/
const EDITABLE_TOPIC_LABEL = /^CATA-/

export function replaceTopicTypeLabel(
  labels: readonly string[],
  type: ForumAPI.FeedbackTopicType,
): string[] {
  return uniqueLabels([...labels.filter(label => !TOPIC_TYPE_LABEL.test(label)), `TYP-${type}`])
}

export function replaceEditableTopicLabels(labels: readonly string[], editableLabels: readonly string[]): string[] {
  return uniqueLabels([
    ...labels.filter(label => !EDITABLE_TOPIC_LABEL.test(label)),
    ...editableLabels.filter(label => EDITABLE_TOPIC_LABEL.test(label)),
  ])
}

export function getEditableTopicLabels(labels: readonly string[]): string[] {
  return labels.filter(label => EDITABLE_TOPIC_LABEL.test(label))
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
