import type { Ref } from 'vue'
import type { ForumSearchFacet, ForumSearchQuery } from '~/forum/services/searchQuery'
import { computed, ref, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumSearchToken } from '~/forum/composables/useForumSearchToken'
import { clearStructuredSearchFilters, mergeTypedSearchFacet } from '~/forum/services/searchInput'
import {
  parseForumSearchQuery,
  stringifyForumSearchQuery,
  toggleForumSearchFacet,
} from '~/forum/services/searchQuery'

/** 搜索框的结构化过滤器状态；焦点与建议列表仍由视图组件管理。 */
export function useForumSearchFilters(query: Ref<string>, page: () => boolean) {
  const { message } = useLocalized()
  const { findSearchFacet, formatSearchToken, parseSearchToken } = useForumSearchToken()
  const activeFacet = ref<ForumSearchFacet | null>(page() ? 'state' : null)
  const filterDraft = ref('')
  const editingFilter = ref(false)
  const parsedQuery = computed(() => parseForumSearchQuery(query.value))
  const textQuery = computed({
    get: () => parsedQuery.value.text,
    set: text => query.value = stringifyForumSearchQuery({ ...parsedQuery.value, text }),
  })
  const filterToken = computed(() => formatSearchToken(parsedQuery.value) || null)

  watch(filterToken, (token) => {
    if (!editingFilter.value)
      filterDraft.value = token ?? ''
  }, { immediate: true })

  function facetPrefix(facet: ForumSearchFacet): string {
    return `${message.value.forum.topic.searchFacets[facet]}:`
  }

  function formatFacetDraft(value: ForumSearchQuery, facet: ForumSearchFacet): string {
    const token = formatSearchToken(value)
    const hasFacetValue = facet === 'tags'
      ? value.tags.length > 0
      : facet === 'state'
        ? value.states.length > 0
        : Boolean(value.author)
    return hasFacetValue ? token : [token, facetPrefix(facet)].filter(Boolean).join(' ')
  }

  function resetDraft(): void {
    editingFilter.value = false
    filterDraft.value = filterToken.value ?? ''
    if (!page())
      activeFacet.value = null
  }

  function clear(): string {
    const next = clearStructuredSearchFilters(query.value)
    query.value = next
    resetDraft()
    filterDraft.value = ''
    return next
  }

  function beginEdit(): void {
    filterDraft.value = activeFacet.value
      ? formatFacetDraft(parsedQuery.value, activeFacet.value)
      : filterToken.value ?? ''
    editingFilter.value = true
  }

  function applyDraft(): string {
    const filters = parseSearchToken(filterDraft.value)
    const next = stringifyForumSearchQuery({ text: textQuery.value, ...filters })
    query.value = next
    return next
  }

  function finishDraft(next: string): void {
    editingFilter.value = false
    filterDraft.value = formatSearchToken(parseForumSearchQuery(next))
  }

  function hasIncompleteFacetDraft(): boolean {
    const draft = filterDraft.value.trim()
    const parsed = parseSearchToken(draft)
    return Boolean(draft && findSearchFacet(draft) && !parsed.tags.length && !parsed.states.length && !parsed.author)
  }

  function selectFacet(facet: ForumSearchFacet): void {
    activeFacet.value = facet
    editingFilter.value = !page()
    filterDraft.value = formatFacetDraft(parsedQuery.value, facet)
  }

  function toggleFacet(facet: ForumSearchFacet, value: string): string {
    const next = toggleForumSearchFacet(query.value, facet, value)
    query.value = next
    filterDraft.value = activeFacet.value
      ? formatFacetDraft(parseForumSearchQuery(next), activeFacet.value)
      : formatSearchToken(parseForumSearchQuery(next))
    return next
  }

  function consumeTextFacet(value: string): { facet: ForumSearchFacet, next: string, remainder: string } | null {
    const facet = findSearchFacet(value)
    if (!facet)
      return null
    const typedFilters = parseSearchToken(value)
    const next = mergeTypedSearchFacet(query.value, typedFilters)
    query.value = next
    const colonIndex = value.indexOf(':')
    const remainder = colonIndex >= 0 ? value.slice(colonIndex + 1) : ''
    selectFacet(facet)
    if (remainder)
      filterDraft.value = `${facetPrefix(facet)}${remainder}`
    return { facet, next, remainder }
  }

  return {
    activeFacet,
    applyDraft,
    beginEdit,
    clear,
    consumeTextFacet,
    editingFilter,
    filterDraft,
    filterToken,
    finishDraft,
    hasIncompleteFacetDraft,
    parsedQuery,
    resetDraft,
    selectFacet,
    textQuery,
    toggleFacet,
  }
}
