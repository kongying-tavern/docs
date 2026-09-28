import type { ForumTranslatorRef } from './useTopicTranslationMenu'
import type ForumAPI from '~/forum/api/forum'
import { isArray } from 'lodash-es'
import { computed, useTemplateRef } from 'vue'
import { useTopicTranslationMenu } from './useTopicTranslationMenu'

export function useTopicState(topic: ForumAPI.Topic | ForumAPI.Post) {
  const translator = useTemplateRef<ForumTranslatorRef>('translator')
  const menu = useTopicTranslationMenu(topic, translator)
  const showComment = computed(() => isArray(topic.relatedComments) && topic.type !== 'ANN')

  return {
    translator,
    menu,
    showComment,
  }
}
