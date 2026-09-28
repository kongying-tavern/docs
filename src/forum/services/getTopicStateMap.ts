import type ForumAPI from '~/forum/api/forum'
import { useLocalized } from '@/hooks/useLocalized'

/**
 * Gitee 三态在本项目里的称呼，刻意与导航/筛选器一致：
 * 导航的 closedFeedback 查询的正是 Gitee 的 progressing，archivedFeedback 查询 closed
 * （见 forumStateForFilter）。故三态各自的用户可读名称为：
 * open → 未结反馈、progressing → 已结反馈、closed → 已归档反馈。
 */
export function getTopicStateMap() {
  const { message } = useLocalized()

  return new Map<ForumAPI.TopicState, string>([
    ['open', message.value.forum.header.navigation.allFeedback],
    ['progressing', message.value.forum.header.navigation.closedFeedback],
    ['closed', message.value.forum.header.navigation.archivedFeedback],
  ])
}
