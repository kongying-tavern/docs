import type { MaybeRefOrGetter } from 'vue'
import type { CustomConfig } from '~/types/locales'
import { toValue } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'

type ForumPublishTags = CustomConfig['forum']['publish']['tags']

function buildTopicTagMap(tags: ForumPublishTags) {
  return new Map([
    ['DOCS-ISSUE', tags.issue.docs],
    ['TYPOS-ISSUE', tags.issue.typos],
    ['DISPLAY-ISSUE', tags.issue.display],
    ['LOGIN-ISSUE', tags.issue.login],
    ['PERFORMANCE-ISSUE', tags.issue.performance],
    ['TRANSLATION-ISSUE', tags.issue.translation],
    ['OTHER-ISSUE', tags.issue.other],
    ['PIN-ISSUE', tags.issue.pin],
    ['ALL-PLATFORM', tags.platforms.all],
    ['WEB-PLATFORM', tags.platforms.web],
    ['CLIENT-PLATFORM', tags.platforms.client],
  ])
}

/**
 * 反馈标签 → 站点 i18n 显示名映射。
 * 不传 message 时返回当前语言的快照；传入响应式 message
 * （如 useLocalized().message）并在 computed 中使用时，可随语言切换重建。
 */
export function getTopicTagMap(
  message: MaybeRefOrGetter<CustomConfig> = useLocalized().message,
) {
  return buildTopicTagMap(toValue(message).forum.publish.tags)
}
