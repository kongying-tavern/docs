import type ForumAPI from '~/forum/api/forum'

export interface TopicStatusDefinition {
  id: ForumAPI.TopicStatus
  label: `ST-${string}`
  group: TopicStatusGroup
  icon: string
  colorClass: string
  topicTypes?: readonly ForumAPI.FeedbackTopicType[]
  hidesTopic?: boolean
}

export type TopicStatusGroup = 'planning' | 'triage' | 'maintenance' | 'resolution'

export const TOPIC_STATUS_GROUP_ORDER: readonly TopicStatusGroup[] = ['planning', 'triage', 'maintenance', 'resolution']

export interface TopicStatusGroupEntry {
  group: TopicStatusGroup
  definitions: TopicStatusDefinition[]
}

export const TOPIC_STATUS_DEFINITIONS: readonly TopicStatusDefinition[] = [
  { id: 'roadmap', label: 'ST-ROADMAP', group: 'planning', icon: 'i-lucide-map', colorClass: 'bg-teal-500', topicTypes: ['FEAT'] },
  { id: 'rfc', label: 'ST-RFC', group: 'planning', icon: 'i-lucide-file-text', colorClass: 'bg-indigo-500', topicTypes: ['FEAT'] },
  { id: 'not-planned', label: 'ST-NOT-PLANNED', group: 'resolution', icon: 'i-lucide-calendar-x', colorClass: 'bg-slate-500', topicTypes: ['FEAT'], hidesTopic: true },
  { id: 'wontfix', label: 'ST-WONTFIX', group: 'resolution', icon: 'i-lucide-circle-slash', colorClass: 'bg-rose-600', topicTypes: ['BUG'], hidesTopic: true },
  { id: 'fixed', label: 'ST-FIXED', group: 'resolution', icon: 'i-lucide-circle-check', colorClass: 'bg-emerald-500', topicTypes: ['BUG'], hidesTopic: true },
  { id: 'not-reproducible', label: 'ST-NOT-REPRODUCIBLE', group: 'resolution', icon: 'i-lucide-circle-help', colorClass: 'bg-orange-500', topicTypes: ['BUG'], hidesTopic: true },
  { id: 'confirmed', label: 'ST-CONFIRMED', group: 'triage', icon: 'i-lucide-shield-check', colorClass: 'bg-blue-500', topicTypes: ['BUG'] },
  { id: 'needs-triage', label: 'ST-NEEDS-TRIAGE', group: 'triage', icon: 'i-lucide-circle-dot', colorClass: 'bg-amber-500', topicTypes: ['BUG'] },
  { id: 'blocked', label: 'ST-BLOCKED', group: 'triage', icon: 'i-lucide-ban', colorClass: 'bg-red-600', topicTypes: ['BUG'] },
  { id: 'needs-more-info', label: 'ST-NEEDS-MORE-INFO', group: 'triage', icon: 'i-lucide-info', colorClass: 'bg-cyan-500', topicTypes: ['BUG'] },
  { id: 'stale', label: 'ST-STALE', group: 'maintenance', icon: 'i-lucide-clock', colorClass: 'bg-stone-500' },
  { id: 'duplicate', label: 'ST-DUPLICATE', group: 'resolution', icon: 'i-lucide-copy', colorClass: 'bg-violet-500', hidesTopic: true },
  { id: 'invalid', label: 'ST-INVALID', group: 'resolution', icon: 'i-lucide-circle-x', colorClass: 'bg-pink-600', hidesTopic: true },
] as const

export const TOPIC_EXTRA_STATUS_PRESENTATION: Record<'closed' | 'good-issue', { icon: string, colorClass: string }> = {
  'closed': { icon: 'i-lucide-archive', colorClass: 'bg-[var(--forum-topic-status-resolved)]' },
  'good-issue': { icon: 'i-lucide-star', colorClass: 'bg-yellow-500' },
}

export const TOPIC_STATUS_LABEL = /^ST-/
const definitionByStatus = new Map<ForumAPI.TopicStatus, TopicStatusDefinition>(
  TOPIC_STATUS_DEFINITIONS.map(definition => [definition.id, definition]),
)
const definitionByLabel = new Map<string, TopicStatusDefinition>(
  TOPIC_STATUS_DEFINITIONS.map(definition => [definition.label, definition]),
)

export function getTopicStatus(labels: readonly string[]): ForumAPI.TopicStatus | undefined {
  for (const label of labels) {
    const status = definitionByLabel.get(label)?.id
    if (status)
      return status
  }
}

/**
 * 单个标签名 → 状态。供操作日志解析使用：那里的标签名只出现在
 * `after_change_value`，需要逐个判定是否为受管状态标签。
 */
export function getTopicStatusFromLabel(label: string): ForumAPI.TopicStatus | undefined {
  return definitionByLabel.get(label)?.id
}

export function getTopicDisplayStatus(
  status: ForumAPI.TopicStatus | undefined,
  state: ForumAPI.TopicState | undefined,
): ForumAPI.TopicDisplayStatus | undefined {
  return status ?? (state === 'closed' || state === 'progressing' ? 'closed' : undefined)
}

export function replaceTopicStatus(
  labels: readonly string[],
  status: ForumAPI.TopicStatus | null,
): string[] {
  const next = labels.filter(label => !TOPIC_STATUS_LABEL.test(label))
  const definition = status ? definitionByStatus.get(status) : undefined
  return definition ? [...new Set([...next, definition.label])] : [...new Set(next)]
}

export function getAvailableTopicStatuses(type: ForumAPI.TopicKind): TopicStatusDefinition[] {
  return TOPIC_STATUS_DEFINITIONS.filter(
    definition => !definition.topicTypes || definition.topicTypes.includes(type as ForumAPI.FeedbackTopicType),
  )
}

export function getTopicStatusDefinition(status: ForumAPI.TopicStatus): TopicStatusDefinition {
  const definition = definitionByStatus.get(status)
  if (!definition)
    throw new Error(`Unknown topic status: ${status}`)
  return definition
}

export function getTopicStatusColorClass(
  status: ForumAPI.TopicDisplayStatus | 'good-issue',
): string {
  if (status === 'closed' || status === 'good-issue')
    return TOPIC_EXTRA_STATUS_PRESENTATION[status].colorClass
  return getTopicStatusDefinition(status).colorClass
}

export function getConclusiveTopicStatuses(type: ForumAPI.TopicKind): TopicStatusDefinition[] {
  return getAvailableTopicStatuses(type).filter(definition => definition.hidesTopic)
}

/**
 * 按 {@link TOPIC_STATUS_GROUP_ORDER} 归类。整组为空时直接省略，
 * 因为话题类型与归档场景都会裁掉整组状态。
 */
export function groupTopicStatuses(definitions: readonly TopicStatusDefinition[]): TopicStatusGroupEntry[] {
  return TOPIC_STATUS_GROUP_ORDER.flatMap((group) => {
    const grouped = definitions.filter(definition => definition.group === group)
    return grouped.length ? [{ group, definitions: grouped }] : []
  })
}

/**
 * 菜单可选的状态：类型可用集合去掉当前状态。
 * 已经是当前值再选一次没有意义，也避免用户误以为「重新选中」会有别的效果。
 * 当前状态若不在可用集合里（类型被改过、标签漂移），同样不会出现在候选里 ——
 * 那种情况靠「清除状态」离场。
 */
export function getSelectableTopicStatuses(
  type: ForumAPI.TopicKind,
  currentStatus?: ForumAPI.TopicStatus,
): TopicStatusDefinition[] {
  return getAvailableTopicStatuses(type).filter(definition => definition.id !== currentStatus)
}

export function topicStatusHidesTopic(status: ForumAPI.TopicStatus): boolean {
  return definitionByStatus.get(status)?.hidesTopic === true
}
