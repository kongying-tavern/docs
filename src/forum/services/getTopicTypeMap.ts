import type { Composer } from 'vue-i18n'

export function getTopicTypeMap(t: Composer['t']) {
  return new Map([
    ['FEAT', t('forum.topic.type.feat')],
    ['ANN', t('forum.topic.type.ann')],
    ['BUG', t('forum.topic.type.bug')],
    ['POST', t('forum.labels.teamBlog')],
  ])
}
