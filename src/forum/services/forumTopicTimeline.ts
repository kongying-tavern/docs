import type ForumAPI from '~/forum/api/types'

/**
 * 除创建锚点外是否存在状态变化。
 * 只有创建记录的话题不占据 aside 空间，状态时间线整块隐藏。
 */
export function hasTopicTimelineChanges(events: readonly ForumAPI.TopicTimelineEvent[]): boolean {
  return events.some(event => event.kind !== 'created')
}

/**
 * 操作日志缺 `create` 条目时（迁移数据或较早的 issue）用话题快照补齐创建锚点，
 * 使「状态变化」节点始终有起点可读。
 */
export function ensureTopicTimelineAnchor(
  events: readonly ForumAPI.TopicTimelineEvent[],
  topic: Pick<ForumAPI.Topic, 'id' | 'createdAt' | 'user'>,
): ForumAPI.TopicTimelineEvent[] {
  if (events.some(event => event.kind === 'created'))
    return [...events]

  const anchor: ForumAPI.TopicTimelineEvent = {
    id: `topic-created-${topic.id}`,
    kind: 'created',
    at: topic.createdAt,
    ...(topic.user ? { actor: topic.user } : {}),
  }

  return [anchor, ...events]
}
