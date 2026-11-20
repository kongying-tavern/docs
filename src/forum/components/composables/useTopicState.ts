import type { MaybeRefOrGetter } from 'vue'
import type { ForumTranslatorRef } from './useTopicTranslationMenu.ts'
import type ForumAPI from '@/src/forum/api/types.d.ts'
import { isArray } from 'lodash-es'
import { computed, toValue, useTemplateRef } from 'vue'
import { useTopicTranslationMenu } from './useTopicTranslationMenu.ts'

export function useTopicState(topic: MaybeRefOrGetter<ForumAPI.Topic | ForumAPI.Post>) {
  const translator = useTemplateRef<ForumTranslatorRef>('translator')
  const menu = useTopicTranslationMenu(topic, translator)
  const showComment = computed(() => {
    const current = toValue(topic)
    return isArray(current.relatedComments) && current.type !== 'ANN'
  })

  return {
    translator,
    menu,
    showComment,
  }
}
