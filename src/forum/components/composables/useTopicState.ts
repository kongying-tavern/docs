import type { MaybeRefOrGetter } from 'vue'
import type { ForumTranslatorRef } from './useTopicTranslationMenu'
import type ForumAPI from '~/forum/api/types'
import { isArray } from 'lodash-es'
import { computed, toValue, useTemplateRef } from 'vue'
import { useTopicTranslationMenu } from './useTopicTranslationMenu'

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
