import type { ForumSearchFacet, ForumSearchQuery, ForumSearchState } from '~/forum/services/searchQuery'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumLabelStore } from '~/forum/composables/useForumLabelStore'
import { useTopicTagDisplay } from '~/forum/composables/useTopicTagDisplay'
import { getTopicTagLabelGetter } from '~/forum/services/getTopicTagLabelGetter'
import { getTopicTagMap } from '~/forum/services/getTopicTagMap'
import { FORUM_SEARCH_STATES, parseForumSearchQuery } from '~/forum/services/searchQuery'

const REGEXP_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/gu

export function useForumSearchToken() {
  const { message } = useLocalized()
  // 响应式：语言切换后按新 locale 重建，token 解析别名随语言更新
  const topicTagMap = computed(() => getTopicTagMap(message))
  const topicTagLabelGetter = getTopicTagLabelGetter()
  const labelStore = useForumLabelStore()
  const { getTagDisplay } = useTopicTagDisplay()
  const localizedTagLabels = computed(() => {
    const staticEntries = Array.from(
      topicTagMap.value,
      ([tag, display]) => [display, topicTagLabelGetter.getLabel(tag) ?? tag] as [string, string],
    )
    // 动态标签（管理页新增、静态表里没有的）以显示名 → label 参与 token 解析
    const dynamicEntries = labelStore.categoryLabels.value
      .filter(label => !topicTagLabelGetter.isLabel(label.name))
      .map(label => [getTagDisplay(label.name), label.name] as [string, string])
    return new Map([...staticEntries, ...dynamicEntries])
  })
  const localizedStateLabels = computed(() => new Map(
    FORUM_SEARCH_STATES.map(state => [getStateLabel(state), state]),
  ))
  const facetAliases = computed(() => [
    { facet: 'tags' as const, labels: [message.value.forum.topic.searchFacets.tags, 'tags'] },
    { facet: 'state' as const, labels: [message.value.forum.topic.searchFacets.state, 'state'] },
    { facet: 'author' as const, labels: [message.value.forum.topic.searchFacets.author, 'author'] },
  ].flatMap(({ facet, labels }) =>
    Array.from(new Set(labels), label => ({ facet, label, normalizedLabel: label.toLocaleLowerCase() })),
  ))

  function getStateLabel(state: ForumSearchState): string {
    return state === 'good-issue'
      ? message.value.forum.topic.status.goodIssue
      : message.value.forum.topic.status[state] ?? state
  }

  function formatSearchToken(query: ForumSearchQuery): string {
    const parts = [
      query.tags.length
        ? `${message.value.forum.topic.searchFacets.tags}:${query.tags.map(label => getTagDisplay(label)).join(',')}`
        : '',
      query.states.length
        ? `${message.value.forum.topic.searchFacets.state}:${query.states.map(getStateLabel).join(',')}`
        : '',
      query.author
        ? `${message.value.forum.topic.searchFacets.author}:${query.author}`
        : '',
    ]
    return parts.filter(Boolean).join(' ')
  }

  function formatSearchQuery(value: string): string {
    const query = parseForumSearchQuery(value)
    return [formatSearchToken(query), query.text].filter(Boolean).join(' ')
  }

  function parseSearchToken(value: string): Pick<ForumSearchQuery, 'tags' | 'states' | 'author'> {
    const tags: string[] = []
    const states: ForumSearchState[] = []
    let author: string | null = null
    const aliasByLabel = new Map(facetAliases.value.map(alias => [alias.normalizedLabel, alias.facet]))
    const pattern = facetAliases.value
      .map(alias => escapeRegExp(alias.label))
      .sort((a, b) => b.length - a.length)
      .join('|')
    const matcher = new RegExp(`(?:^|\\s)(${pattern}):(\\S+)`, 'giu')

    for (const match of value.matchAll(matcher)) {
      const facet = aliasByLabel.get(match[1].toLocaleLowerCase())
      if (!facet)
        continue
      const values = match[2].split(',').map(item => item.trim()).filter(Boolean)
      if (facet === 'tags')
        tags.push(...values.map(item => localizedTagLabels.value.get(item) ?? item))
      else if (facet === 'state')
        states.push(...values.map(item => localizedStateLabels.value.get(item) ?? item).filter(isSearchState))
      else
        author = values[0] ?? null
    }

    return { tags: [...new Set(tags)], states: [...new Set(states)], author }
  }

  function findSearchFacet(value: string): ForumSearchFacet | null {
    const normalized = value.trimStart().toLocaleLowerCase()
    return facetAliases.value.find(alias => normalized.startsWith(`${alias.normalizedLabel}:`))?.facet ?? null
  }

  function isSearchState(value: string): value is ForumSearchState {
    return FORUM_SEARCH_STATES.includes(value as ForumSearchState)
  }

  return {
    formatSearchQuery,
    formatSearchToken,
    findSearchFacet,
    parseSearchToken,
    getStateLabel,
  }
}

function escapeRegExp(value: string): string {
  return value.replace(REGEXP_SPECIAL_CHARACTERS, '\\$&')
}
