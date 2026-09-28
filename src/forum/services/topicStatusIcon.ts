import type ForumAPI from '~/forum/api/types'
import { TOPIC_EXTRA_STATUS_PRESENTATION, TOPIC_STATUS_DEFINITIONS } from './topicStatus'

export type TopicStatusIconKey = ForumAPI.TopicDisplayStatus | 'good-issue'

export const TOPIC_STATUS_ICON = Object.fromEntries([
  ...TOPIC_STATUS_DEFINITIONS.map(definition => [definition.id, definition.icon]),
  ...Object.entries(TOPIC_EXTRA_STATUS_PRESENTATION).map(([status, presentation]) => [status, presentation.icon]),
]) as Record<TopicStatusIconKey, string>

export function getTopicStatusIcon(status: TopicStatusIconKey | undefined): string | undefined {
  return status ? TOPIC_STATUS_ICON[status] : undefined
}

/**
 * Gitee 三态各自的图标。两点约束：
 * 1. 按**原始状态**取，而不是走 `getTopicDisplayStatus` 折叠后的展示状态 ——
 *    `progressing`（已结反馈）与 `closed`（已归档反馈）的展示状态都是 `closed`、方块同色，
 *    若都走展示状态就会双双落成同一个图标，把「已解决」与「归档」说成一回事。
 * 2. 统一用 lucide 的 `circle-*` 圆形家族，与轨道上其它节点（`circle-plus`/`circle-dot`/
 *    `circle-minus`）形状一致。lucide 没有圆形的 archive，故「已归档」取 `circle-off`。
 */
export const TOPIC_STATE_ICON: Record<ForumAPI.TopicState, string> = {
  open: 'i-lucide-circle-dashed',
  progressing: 'i-lucide-circle-check-big',
  closed: 'i-lucide-circle-off',
}

export function getTopicStateIcon(state: ForumAPI.TopicState | undefined): string | undefined {
  return state ? TOPIC_STATE_ICON[state] : undefined
}
