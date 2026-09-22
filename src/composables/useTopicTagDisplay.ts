import { getTopicTagLabelGetter } from '~/composables/getTopicTagLabelGetter'
import { getTopicTagMap } from '~/composables/getTopicTagMap'
import { getFallbackLabelDisplay } from '~/services/forum/forumLabelTaxonomy'

/**
 * 反馈标签的显示名解析：i18n 词条优先，其次静态映射反查，
 * 最后回退到标签名本身（CATA- 前缀去掉）——覆盖管理页动态新增、
 * 静态表里没有的标签，避免界面上露出原始前缀名。
 */
export function useTopicTagDisplay() {
  const topicTagMap = getTopicTagMap()
  const topicTagLabelGetter = getTopicTagLabelGetter()

  function getTagDisplay(label: string | null | undefined): string {
    if (!label)
      return ''
    return topicTagMap.get(label)
      ?? topicTagMap.get(topicTagLabelGetter.getTag(label) ?? '')
      ?? getFallbackLabelDisplay(label)
  }

  return { getTagDisplay }
}
