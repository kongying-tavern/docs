<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type ForumAPI from '~/forum/api/types'
import type { ForumSearchFacet } from '~/forum/services/forumSearchQuery'
import { useRouter } from 'vitepress'
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue'
import { SearchField, SearchFieldTransition } from '@/components/ui/search-field'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { useForumShortcut } from '~/forum/composables/view/useForumShortcut'
import { stringifyForumSearchQuery } from '~/forum/services/forumSearchQuery'
import { getForumSearchSuggestions } from '~/forum/services/forumSearchSuggestions'
import ForumTopicMetadata from '../ui/ForumTopicMetadata.vue'
import { useForumSearchFilters } from './composables/useForumSearchFilters'
import ForumSearchFilterPicker from './ForumSearchFilterPicker.vue'

const props = withDefaults(defineProps<{
  autofocus?: boolean
  page?: boolean
  showFacets?: boolean
  suggestionMode?: boolean
  suggestionLoading?: boolean
  suggestionError?: boolean
  class?: HTMLAttributes['class']
  suggestions?: ForumAPI.Topic[]
}>(), {
  suggestions: () => [],
})
const emit = defineEmits<{ submit: [query: string] }>()
const SEARCH_TEXT_MAX_LENGTH = 50
const modelValue = defineModel<string>('query', { required: true })
const { message } = useLocalized()
const router = useRouter()
const { topicHref } = useForumRoute()
const filters = useForumSearchFilters(modelValue, () => Boolean(props.page))
const {
  activeFacet,
  editingFilter,
  filterDraft,
  filterToken,
  parsedQuery,
  textQuery,
} = filters
const inputId = `forum-search-${useId()}`
const listboxId = `${inputId}-suggestions`
const isOpen = ref(false)
const activeIndex = ref(-1)
const filterPicker = useTemplateRef<InstanceType<typeof ForumSearchFilterPicker>>('filterPicker')
const filterInputEl = useTemplateRef<HTMLInputElement>('filterInputEl')
const loadedUsers = computed(() => props.suggestions.map(topic => topic.user))

const inputEl = useTemplateRef<InstanceType<typeof SearchField>>('inputEl')

const filteredSuggestions = computed(() => {
  return getForumSearchSuggestions(props.suggestions, textQuery.value)
})
const showSuggestions = computed(() => {
  const visible = props.page ? props.suggestionMode : isOpen.value
  return Boolean(visible && textQuery.value && filteredSuggestions.value.length > 0)
})
const showFilterPicker = computed(() => !props.page && isOpen.value && !textQuery.value)

watch(filteredSuggestions, () => activeIndex.value = -1)

function handleExpand() {
  inputEl.value?.focus()
}
useForumShortcut('search', handleExpand, { priority: props.page ? 1 : 0 })

function handleSearch() {
  isOpen.value = false
  emit('submit', stringifyForumSearchQuery(parsedQuery.value))
}

function removeStructuredFilter() {
  const next = filters.clear()
  emit('submit', next)
}

function handleBackspace(event: KeyboardEvent) {
  if (event.key !== 'Backspace' || event.isComposing || textQuery.value || !filterToken.value)
    return

  event.preventDefault()
  removeStructuredFilter()
}

function handleFilterFocus() {
  filters.beginEdit()
  isOpen.value = true
}

function handleFilterInput(event?: Event) {
  if ((event as InputEvent | undefined)?.isComposing)
    return
  return filters.applyDraft()
}

function focusRemainsInSearch(event: FocusEvent): boolean {
  return event.relatedTarget instanceof Node && Boolean(inputEl.value?.contains(event.relatedTarget))
}

function handleFilterBlur(event: FocusEvent) {
  if (focusRemainsInSearch(event))
    return
  if (filters.hasIncompleteFacetDraft()) {
    if (!props.page)
      activeFacet.value = null
    isOpen.value = false
    return
  }
  const next = stringifyForumSearchQuery(parsedQuery.value)
  filters.resetDraft()
  isOpen.value = false
  emit('submit', next)
}

function handleFilterSubmit() {
  const next = filters.applyDraft()
  filters.finishDraft(next)
  isOpen.value = false
  emit('submit', next)
}

function handleFilterEnter(event: KeyboardEvent) {
  if (event.isComposing)
    return
  event.preventDefault()
  if (showFilterPicker.value)
    filterPicker.value?.selectActive()
  else
    handleFilterSubmit()
}

function handleTextInput(event: Event) {
  if ((event as InputEvent).isComposing)
    return
  const input = event.currentTarget as HTMLInputElement
  const consumed = filters.consumeTextFacet(input.value)
  if (consumed) {
    inputEl.value?.clear()
    focusFacet(consumed.facet)
    emit('submit', consumed.next)
    return
  }

  if (!props.page)
    activeFacet.value = null
  editingFilter.value = false
  isOpen.value = true
}

function moveActive(offset: number, event: KeyboardEvent) {
  if (event.isComposing)
    return
  event.preventDefault()
  if (showFilterPicker.value) {
    filterPicker.value?.moveActive(offset)
    return
  }
  if (!showSuggestions.value) {
    isOpen.value = true
    return
  }

  const count = filteredSuggestions.value.length
  activeIndex.value = activeIndex.value === -1
    ? (offset > 0 ? 0 : count - 1)
    : (activeIndex.value + offset + count) % count
  nextTick(() => document.getElementById(`${listboxId}-${activeIndex.value}`)?.scrollIntoView({ block: 'nearest' }))
}

function selectActive(event: KeyboardEvent) {
  if (event.isComposing)
    return
  event.preventDefault()
  if (props.page)
    return handleSearch()
  if (showFilterPicker.value) {
    filterPicker.value?.selectActive()
    return
  }
  const suggestion = filteredSuggestions.value[activeIndex.value]
  if (!suggestion)
    return handleSearch()

  isOpen.value = false
  router.go(topicHref(String(suggestion.topic.id), null))
}

function chooseFacet(facet: ForumSearchFacet) {
  filters.selectFacet(facet)
  focusFacet(facet)
}

function focusFacet(facet: ForumSearchFacet) {
  if (!props.page && facet !== 'author') {
    nextTick(() => {
      const input = filterInputEl.value
      input?.focus()
      input?.setSelectionRange(input.value.length, input.value.length)
    })
  }
}

function leaveFacet() {
  const next = stringifyForumSearchQuery(parsedQuery.value)
  modelValue.value = next
  filters.resetDraft()
  emit('submit', next)
  nextTick(() => inputEl.value?.focus())
}

function toggleFacet(facet: ForumSearchFacet, value: string) {
  const next = filters.toggleFacet(facet, value)
  emit('submit', next)
}

function handleEscape(event: KeyboardEvent) {
  if (event.isComposing)
    return
  event.preventDefault()
  event.stopPropagation()
  if (activeFacet.value && !props.page)
    leaveFacet()
  else
    isOpen.value = false
}

function handleInputBlur(event: FocusEvent) {
  if (focusRemainsInSearch(event))
    return
  isOpen.value = false
  filters.resetDraft()
}
</script>

<template>
  <SearchField
    ref="inputEl"
    v-model="textQuery"
    class="forum-search-box" :class="[$props.class]"
    :page="page"
    :autofocus="autofocus"
    :has-criteria="Boolean(modelValue.trim())"
    :label="message.ui.button.search"
    :placeholder="page ? message.forum.header.search.placeholder : message.ui.button.search"
    :maxlength="SEARCH_TEXT_MAX_LENGTH"
    role="combobox"
    aria-autocomplete="list"
    :aria-controls="showSuggestions || showFilterPicker ? listboxId : undefined"
    :aria-expanded="showSuggestions || showFilterPicker"
    :aria-activedescendant="showSuggestions && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined"
    @focus="isOpen = true"
    @leave="handleInputBlur"
    @input="handleTextInput"
    @compositionend="handleTextInput"
    @keydown.down="moveActive(1, $event)"
    @keydown.up="moveActive(-1, $event)"
    @keydown.enter="selectActive($event)"
    @keydown.esc="handleEscape"
    @keydown="handleBackspace"
    @search="handleSearch"
    @submit="handleSearch"
  >
    <template #prefix>
      <div v-if="filterToken || editingFilter" class="search-field-prefix">
        <input
          ref="filterInputEl"
          v-model="filterDraft"
          type="text"
          class="search-field-token"
          :aria-label="message.forum.topic.searchFacets.label"
          :size="Math.max(filterDraft.length, 1)"
          :title="filterDraft"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          role="combobox"
          aria-autocomplete="list"
          :aria-controls="listboxId"
          :aria-expanded="showFilterPicker"
          @focus="handleFilterFocus"
          @input="handleFilterInput"
          @compositionend="handleFilterInput"
          @blur="handleFilterBlur"
          @keydown.enter="handleFilterEnter($event)"
          @keydown.down="moveActive(1, $event)"
          @keydown.up="moveActive(-1, $event)"
          @keydown.esc="handleEscape"
        >
      </div>
    </template>

    <SearchFieldTransition>
      <ForumSearchFilterPicker
        v-if="(page && showFacets) || showFilterPicker"
        :id="listboxId"
        ref="filterPicker"
        :query="parsedQuery"
        :facet="activeFacet"
        :users="loadedUsers"
        :inline="page"
        @back="leaveFacet"
        @choose-facet="chooseFacet"
        @toggle="toggleFacet"
      />
    </SearchFieldTransition>

    <div v-if="page && suggestionMode && suggestionLoading" class="search-field-result-state" role="status">
      {{ message.ui.button.loading }}
    </div>
    <div v-else-if="page && suggestionMode && suggestionError" class="search-field-result-state" role="status">
      {{ message.forum.loadError }}
    </div>
    <div v-else-if="page && suggestionMode && !showSuggestions" class="search-field-result-state" role="status">
      {{ message.forum.empty.searchDescription }}
    </div>

    <SearchFieldTransition>
      <div
        v-if="showSuggestions"
        :id="listboxId"
        class="search-field-results"
        role="listbox"
        :aria-label="message.ui.button.search"
      >
        <button
          v-for="(suggestion, index) in filteredSuggestions"
          :id="`${listboxId}-${index}`"
          :key="suggestion.topic.id"
          type="button"
          class="search-field-result"
          :class="{ active: activeIndex === index }"
          role="option"
          :aria-selected="activeIndex === index"
          @mouseenter="activeIndex = index"
          @mousedown.prevent
          @click="isOpen = false; router.go(topicHref(String(suggestion.topic.id), null))"
        >
          <ForumTopicMetadata
            class="search-field-result-type shrink-0"
            :type="suggestion.topic.type"
            :topic-id="suggestion.topic.id"
            :state="suggestion.topic.state"
            :status="suggestion.topic.status"
            :good-issue="suggestion.topic.goodIssue"
            icon-only
          />
          <span class="flex-1 min-w-0">
            <span class="search-field-result-title block truncate">{{ suggestion.topic.title }}</span>
            <span v-if="suggestion.excerpt" class="search-field-result-excerpt block truncate">
              {{ suggestion.excerpt }}
            </span>
          </span>
          <span class="i-lucide-arrow-up-right color-[var(--vp-c-text-3)] icon-btn shrink-0 size-3.5" aria-hidden="true" />
        </button>
      </div>
    </SearchFieldTransition>
  </SearchField>
</template>
