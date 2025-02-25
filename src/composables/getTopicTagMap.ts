import { useLocalized } from '@/hooks/useLocalized'

export function getTopicTagMap() {
  const { message } = useLocalized()

  return new Map([
    ['DOCS-ISSUE', message.value.forum.publish.tags.issue.docs],
    ['TYPOS-ISSUE', message.value.forum.publish.tags.issue.typos],
    ['DISPLAY-ISSUE', message.value.forum.publish.tags.issue.display],
    ['LOGIN-ISSUE', message.value.forum.publish.tags.issue.login],
    ['PERFORMANCE-ISSUE', message.value.forum.publish.tags.issue.performance],
    ['TRANSLATION-ISSUE', message.value.forum.publish.tags.issue.translation],
    ['OTHER-ISSUE', message.value.forum.publish.tags.issue.other],
    ['PIN-ISSUE', message.value.forum.publish.tags.issue.pin],
    ['ALL-PLATFORM', message.value.forum.publish.tags.platforms.all],
    ['WEB-PLATFORM', message.value.forum.publish.tags.platforms.web],
    ['CLIENT-PLATFORM', message.value.forum.publish.tags.platforms.client],
  ])
}
