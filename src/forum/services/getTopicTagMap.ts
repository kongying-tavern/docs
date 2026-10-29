import type { Composer } from 'vue-i18n'

export function getTopicTagMap(t: Composer['t']) {
  return new Map([
    ['DOCS-ISSUE', t('forum.publish.tags.issue.docs')],
    ['TYPOS-ISSUE', t('forum.publish.tags.issue.typos')],
    ['DISPLAY-ISSUE', t('forum.publish.tags.issue.display')],
    ['LOGIN-ISSUE', t('forum.publish.tags.issue.login')],
    ['PERFORMANCE-ISSUE', t('forum.publish.tags.issue.performance')],
    ['TRANSLATION-ISSUE', t('forum.publish.tags.issue.translation')],
    ['OTHER-ISSUE', t('forum.publish.tags.issue.other')],
    ['PIN-ISSUE', t('forum.publish.tags.issue.pin')],
    ['ALL-PLATFORM', t('forum.publish.tags.platforms.all')],
    ['WEB-PLATFORM', t('forum.publish.tags.platforms.web')],
    ['CLIENT-PLATFORM', t('forum.publish.tags.platforms.client')],
  ])
}
