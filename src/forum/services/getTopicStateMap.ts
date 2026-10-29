import type { Composer } from 'vue-i18n'
import type ForumAPI from '~/forum/api/types'

/**
 * Gitee 三态在本项目里的称呼，刻意与导航/筛选器一致：
 * 导航的 closedFeedback 查询的正是 Gitee 的 progressing，archivedFeedback 查询 closed
 * （见 forumStateForFilter）。故三态各自的用户可读名称为：
 * open → 未结反馈、progressing → 已结反馈、closed → 已归档反馈。
 */
export function getTopicStateMap(t: Composer['t']) {
  return new Map<ForumAPI.TopicState, string>([
    ['open', t('forum.header.navigation.allFeedback')],
    ['progressing', t('forum.header.navigation.closedFeedback')],
    ['closed', t('forum.header.navigation.archivedFeedback')],
  ])
}
