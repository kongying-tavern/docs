import type { MaybeRefOrGetter } from 'vue'
import type ForumAPI from '@/src/forum/api/types.d.ts'
import type { FORUM } from '@/src/forum/shared/types.d.ts'
import { computed, toValue } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForumTranslationPreferences } from '@/src/forum/hooks/data/useForumTranslationPreferences.ts'
import { isBrowserTranslationSupported } from '@/src/forum/services/browserTranslation.ts'
import { areLanguagesEquivalent } from '@/src/forum/services/forumLanguage.ts'

export interface ForumTranslatorRef {
  startTranslate: () => void
}

/**
 * ⋮ 菜单里的「翻译贴子」项。仅当目标语言与话题语言不同时显示。
 * 不要求登录：与自动翻译一致（翻译能力对未登录用户同样可用）。
 */
export function useTopicTranslationMenu(
  topic: MaybeRefOrGetter<ForumAPI.Topic | ForumAPI.Post | null | undefined>,
  translator: MaybeRefOrGetter<ForumTranslatorRef | null | undefined>,
) {
  const { targetLanguage } = useForumTranslationPreferences()
  const { t } = useI18n({ useScope: 'global' })

  return computed<FORUM.TopicDropdownMenu[]>(() => {
    const current = toValue(topic)
    const translatorRef = toValue(translator)
    if (
      !current
      || !translatorRef
      || !isBrowserTranslationSupported()
      || areLanguagesEquivalent(current.language, targetLanguage.value)
    ) {
      return []
    }

    return [
      {
        type: 'item',
        id: 'translator',
        label: t('forum.translate.translateText'),
        icon: 'i-lucide-languages',
        order: 2,
        action: translatorRef.startTranslate,
      },
    ]
  })
}
