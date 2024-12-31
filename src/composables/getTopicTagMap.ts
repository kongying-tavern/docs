import { useData } from 'vitepress'

export const getTopicTagMap = () => {
  const { theme } = useData()

  return new Map([
    ['DOCS-ISSUE', theme.value.forum.publish.tags.issue.docs],
    ['TYPOS-ISSUE', theme.value.forum.publish.tags.issue.typos],
    ['DISPLAY-ISSUE', theme.value.forum.publish.tags.issue.display],
    ['LOGIN-ISSUE', theme.value.forum.publish.tags.issue.login],
    ['PERFORMANCE-ISSUE', theme.value.forum.publish.tags.issue.performance],
    ['TRANSLATION-ISSUE', theme.value.forum.publish.tags.issue.translation],
    ['OTHER-ISSUE', theme.value.forum.publish.tags.issue.other],
    ['PIN-ISSUE', theme.value.forum.publish.tags.issue.pin],
    ['ALL-PLATFORM', theme.value.forum.publish.tags.platforms.all],
    ['WEB-PLATFORM', theme.value.forum.publish.tags.platforms.web],
    ['CLIENT-PLATFORM', theme.value.forum.publish.tags.platforms.client],
  ])
}
