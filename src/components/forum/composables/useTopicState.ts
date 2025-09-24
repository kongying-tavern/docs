import type ForumAPI from '@/apis/forum/api'
import type { FORUM } from '../types'
import { useLanguage } from '@/composables/useLanguage'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useCached } from '@vueuse/core'
import { isArray } from 'lodash-es'
import { computed, useTemplateRef } from 'vue'

interface TranslatorComponent {
  startTranslate: () => void
}

export function useTopicState(topic: ForumAPI.Topic | ForumAPI.Post) {
  const userAuth = useUserAuthStore()
  const translator = useTemplateRef<TranslatorComponent>('translator')
  const { isNoTranslationRequirement } = useLanguage()

  // Hash management
  const hash = computed({
    get: () => location.hash.slice(1),
    set: val => (location.hash = val),
  })

  const cachedHash = useCached(hash, (_a, b) => !b.includes('reply'))

  // Menu configuration
  const menu = computed<FORUM.TopicDropdownMenu[]>(() => {
    if (
      topic.type === 'ANN'
      || !userAuth.isTokenValid
      || topic.language === 'zh-CN'
      || isNoTranslationRequirement.value
    ) {
      return []
    }

    return [
      {
        type: 'item',
        id: 'translator',
        label: '翻译贴子',
        icon: 'vpi-languages option-icon',
        order: 2,
        action: () => {
          if (translator.value && typeof translator.value.startTranslate === 'function') {
            translator.value.startTranslate()
          }
        },
      },
    ]
  })

  // Display conditions
  const showComment = computed(() => isArray(topic.relatedComments) && topic.type !== 'ANN')

  return {
    translator,
    menu,
    hash,
    cachedHash,
    showComment,
  }
}
