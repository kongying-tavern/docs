import type { MaybeRefOrGetter } from 'vue'
import type { FORUM } from '../types'
import type ForumAPI from '@/apis/forum/api'
import { computed, toValue } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumTranslationPreferences } from '~/composables/forum/useForumTranslationPreferences'
import { isBrowserTranslationSupported } from '~/services/forum/browserTranslation'
import { areLanguagesEquivalent } from '~/services/forum/forumLanguage'

export interface ForumTranslatorRef {
  startTranslate: () => void
}

/**
 * ⋮ 菜单里的「翻译贴子」项。话题语言与目标语言等价 / 公告 / 浏览器不支持翻译时不显示。
 * 不要求登录：与自动翻译一致（翻译能力对未登录用户同样可用）。
 */
export function useTopicTranslationMenu(
  topic: MaybeRefOrGetter<ForumAPI.Topic | ForumAPI.Post | null | undefined>,
  translator: MaybeRefOrGetter<ForumTranslatorRef | null | undefined>,
) {
  const { targetLanguage } = useForumTranslationPreferences()
  const { message } = useLocalized()

  return computed<FORUM.TopicDropdownMenu[]>(() => {
    const current = toValue(topic)
    const translatorRef = toValue(translator)
    if (
      !current
      || current.type === 'ANN'
      || !isBrowserTranslationSupported()
      || areLanguagesEquivalent(current.language, targetLanguage.value)
    ) {
      return []
    }

    return [
      {
        type: 'item',
        id: 'translator',
        label: message.value.forum.translate.translateText,
        icon: 'i-lucide-languages',
        order: 2,
        action: () => translatorRef?.startTranslate(),
      },
    ]
  })
}
