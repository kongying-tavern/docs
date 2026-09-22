import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useRuleChecks } from '~/composables/useRuleChecks'

export type TopicUserRole = 'author' | 'official' | null

/**
 * 话题语境下某个参与者的身份：就是话题作者 → `author`，否则是团队/反馈组成员 → `official`。
 * 原为 useTopicComment 内联逻辑，抽出来供话题时间线等其它展示参与者的地方共用，
 * 保证「作者 / 官方」的判定只有一处实现（展示仍用 ForumRoleBadge）。
 */
export function useTopicUserRole() {
  const { isOfficial } = useRuleChecks()

  function resolveRole(
    topicAuthorId: MaybeRefOrGetter<string | number | null | undefined>,
    userId: MaybeRefOrGetter<string | number | null | undefined>,
  ): TopicUserRole {
    const actorId = toValue(userId)
    if (actorId === null || actorId === undefined)
      return null

    // 两侧类型都是 string | number，统一按字符串比较，避免类型不一致时漏判
    if (String(toValue(topicAuthorId)) === String(actorId))
      return 'author'

    return isOfficial(actorId).value ? 'official' : null
  }

  return { resolveRole }
}
