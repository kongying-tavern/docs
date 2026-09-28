<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type ForumAPI from '~/forum/api/forum'
import type { ForumSearchFacet } from '~/forum/services/forumSearchQuery'
import { useRouter } from 'vitepress'
import { computed, nextTick, onMounted, ref, useId, useTemplateRef, watch } from 'vue'
import { Input } from '@/components/ui/input'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/forum/composables/useForumRoute'
import { stringifyForumSearchQuery } from '~/forum/services/forumSearchQuery'
import { getForumSearchSuggestions } from '~/forum/services/forumSearchSuggestions'
import ForumTopicTypeBadge from '../ui/ForumTopicTypeBadge.vue'
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
const expanded = ref(false)
const activeIndex = ref(-1)
const filterPicker = useTemplateRef<InstanceType<typeof ForumSearchFilterPicker>>('filterPicker')
const formEl = useTemplateRef<HTMLFormElement>('formEl')
const filterInputEl = useTemplateRef<HTMLInputElement>('filterInputEl')
const loadedUsers = computed(() => props.suggestions.map(topic => topic.user))

const inputEl = useTemplateRef<InstanceType<typeof Input>>('inputEl')
const triggerEl = ref<HTMLButtonElement>()
const collapsedWidth = ref(96)

onMounted(() => {
  collapsedWidth.value = Math.ceil(triggerEl.value?.getBoundingClientRect().width ?? 96)
  if (props.autofocus)
    nextTick(() => inputEl.value?.focus())
})

const filteredSuggestions = computed(() => {
  return getForumSearchSuggestions(props.suggestions, textQuery.value)
})
const showSuggestions = computed(() => {
  const visible = props.page ? props.suggestionMode : isOpen.value
  return Boolean(visible && textQuery.value && filteredSuggestions.value.length > 0)
})
const showFilterPicker = computed(() => !props.page && isOpen.value && !textQuery.value)

watch(filteredSuggestions, () => activeIndex.value = -1)

const shouldExpand = computed(() => props.page || expanded.value || Boolean(modelValue.value.trim()))

function handleExpand() {
  expanded.value = true
  nextTick(() => inputEl.value?.focus())
}

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

function handleFilterInput() {
  return filters.applyDraft()
}

function focusRemainsInSearch(event: FocusEvent): boolean {
  return event.relatedTarget instanceof Node && Boolean(formEl.value?.contains(event.relatedTarget))
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
  const next = handleFilterInput()
  filters.finishDraft(next)
  isOpen.value = false
  emit('submit', next)
}

function handleFilterEnter(event: KeyboardEvent) {
  if (event.isComposing)
    return
  if (showFilterPicker.value)
    filterPicker.value?.selectActive()
  else
    handleFilterSubmit()
}

function handleTextInput(event: Event) {
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

function moveActive(offset: number) {
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
}

function selectActive(event: KeyboardEvent) {
  if (event.isComposing)
    return
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

function handleEscape() {
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
  expanded.value = false
}
</script>

<template>
  <form
    ref="formEl"
    :class="[$props.class, { 'expanded': shouldExpand, 'page-mode': page }]"
    :style="{ width: page ? '100%' : shouldExpand ? 'clamp(224px, 42vw, 520px)' : `${collapsedWidth}px` }"
    class="forum-search-box relative"
    role="search"
    @submit.prevent="handleSearch"
  >
    <label
      :for="inputId"
      class="text-sm text-[var(--vp-c-text-1)] font-medium mb-2 sr-only"
    >
      {{ message.ui.button.search }}
    </label>

    <button
      v-if="!shouldExpand"
      ref="triggerEl"
      type="button"
      class="forum-search-trigger"
      :aria-label="message.ui.button.search"
      @click="handleExpand"
    >
      <span
        class="i-lucide-search icon-btn bg-[var(--vp-c-text-2)] size-4"
        aria-hidden="true"
      />
      <span class="forum-search-trigger-text">{{ message.ui.button.search }}</span>
    </button>

    <template v-else>
      <div class="forum-search-field relative">
        <span
          class="forum-search-icon i-lucide-search icon-btn bg-[var(--vp-c-text-2)] size-4 pointer-events-none left-2.5 top-1/2 absolute -translate-y-1/2"
          aria-hidden="true"
        />
        <div v-if="filterToken || editingFilter" class="forum-search-tokens">
          <input
            ref="filterInputEl"
            v-model="filterDraft"
            type="text"
            class="forum-search-token"
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
            @blur="handleFilterBlur"
            @keydown.enter.prevent="handleFilterEnter($event)"
            @keydown.down.prevent="moveActive(1)"
            @keydown.up.prevent="moveActive(-1)"
            @keydown.esc.prevent="handleEscape"
          >
        </div>
        <Input
          :id="inputId"
          ref="inputEl"
          v-model="textQuery"
          type="search"
          class="forum-search-input text-xs pr-3.5 h-8 shadow-none"
          :class="filterToken ? 'pl-1' : page ? 'pl-10' : 'pl-8'"
          :placeholder="page ? message.forum.header.search.placeholder : message.ui.button.search"
          :maxlength="SEARCH_TEXT_MAX_LENGTH"
          :autofocus="autofocus"
          role="combobox"
          autocomplete="off"
          aria-autocomplete="list"
          :aria-controls="listboxId"
          :aria-expanded="showSuggestions || showFilterPicker"
          :aria-activedescendant="showSuggestions && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined"
          @focus="isOpen = true"
          @blur="handleInputBlur"
          @input="handleTextInput"
          @keydown.down.prevent="moveActive(1)"
          @keydown.up.prevent="moveActive(-1)"
          @keydown.enter.prevent="selectActive($event)"
          @keydown.esc="handleEscape"
          @keydown="handleBackspace"
          @search="handleSearch"
        />
      </div>

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

      <div v-if="page && suggestionMode && suggestionLoading" class="forum-search-suggestion-state">
        {{ message.ui.button.loading }}
      </div>
      <div v-else-if="page && suggestionMode && suggestionError" class="forum-search-suggestion-state">
        {{ message.forum.loadError }}
      </div>
      <div v-else-if="page && suggestionMode && !showSuggestions" class="forum-search-suggestion-state">
        {{ message.forum.empty.searchDescription }}
      </div>

      <div
        v-if="showSuggestions"
        :id="listboxId"
        class="forum-search-suggestions"
        role="listbox"
        :aria-label="message.ui.button.search"
      >
        <button
          v-for="(suggestion, index) in filteredSuggestions"
          :id="`${listboxId}-${index}`"
          :key="suggestion.topic.id"
          type="button"
          class="forum-search-suggestion"
          :class="{ active: activeIndex === index }"
          role="option"
          :aria-selected="activeIndex === index"
          @mouseenter="activeIndex = index"
          @mousedown.prevent
          @click="router.go(topicHref(String(suggestion.topic.id), null))"
        >
          <ForumTopicTypeBadge
            class="forum-search-suggestion-type shrink-0"
            :type="suggestion.topic.type"
            :state="suggestion.topic.state"
            :status="suggestion.topic.status"
            :good-issue="suggestion.topic.goodIssue"
            icon-only
          />
          <span class="flex-1 min-w-0">
            <span class="forum-search-suggestion-title block truncate">{{ suggestion.topic.title }}</span>
            <span v-if="suggestion.excerpt" class="forum-search-suggestion-excerpt block truncate">
              {{ suggestion.excerpt }}
            </span>
          </span>
          <span class="i-lucide-arrow-up-right color-[var(--vp-c-text-3)] icon-btn shrink-0 size-3.5" aria-hidden="true" />
        </button>
      </div>
    </template>
  </form>
</template>

<style scoped>
.forum-search-box {
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.forum-search-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px 0 10px;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: calc(12px * var(--site-ui-scale));
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 160ms ease;
}

.forum-search-trigger:hover {
  background: var(--vp-c-default-soft);
}

.forum-search-box :deep(.forum-search-input) {
  flex: 1 0 96px;
  width: auto;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.forum-search-field {
  display: flex;
  align-items: center;
  min-width: 0;
  border-radius: 9999px;
  background: var(--vp-c-default-soft);
  overflow: hidden;
}

.forum-search-tokens {
  display: flex;
  gap: 4px;
  min-width: 0;
  margin-left: 30px;
  overflow-x: auto;
  scrollbar-width: none;
}

.forum-search-tokens::-webkit-scrollbar {
  display: none;
}

.forum-search-token {
  field-sizing: content;
  box-sizing: content-box;
  width: fit-content;
  min-width: 2ch;
  max-width: 320px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 5px;
  padding: 1px 5px;
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-2);
  caret-color: var(--vp-c-brand-1);
  font-family: inherit;
  font-size: calc(12px * var(--site-ui-scale));
  line-height: calc(20px * var(--site-ui-scale));
  outline: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    color 120ms ease,
    border-color 120ms ease,
    background-color 120ms ease;
}

.forum-search-token:hover {
  border-color: var(--vp-c-border);
  color: var(--vp-c-text-1);
}

.forum-search-token:focus {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.forum-search-input:focus-visible {
  outline: none;
  background: transparent;
  box-shadow: none;
}

.forum-search-box.expanded:focus-within .forum-search-field {
  outline: 2px solid color-mix(in srgb, var(--vp-c-brand-1) 45%, transparent);
  outline-offset: 1px;
}

.forum-search-input:focus {
  background: transparent;
}

.forum-search-box.page-mode .forum-search-field {
  min-height: 48px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-1);
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.forum-search-box.page-mode:focus-within .forum-search-field {
  border-color: var(--vp-c-brand-1);
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vp-c-brand-1) 12%, transparent);
}

.forum-search-box.page-mode :deep(.forum-search-input) {
  height: 46px;
  font-size: calc(15px * var(--site-ui-scale));
}

.forum-search-box.page-mode .forum-search-icon {
  left: 14px;
  width: 19px;
  height: 19px;
}

.forum-search-box.page-mode .forum-search-tokens {
  margin-left: 40px;
}

.forum-search-box.page-mode .forum-search-token {
  font-size: calc(13px * var(--site-ui-scale));
}

.forum-search-box.page-mode .forum-search-suggestions {
  position: static;
  width: var(--forum-search-content-width, 100%);
  max-width: none;
  margin-top: 12px;
  border: 0;
  border-radius: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.forum-search-box.page-mode .forum-search-suggestion + .forum-search-suggestion {
  border-top: 1px solid var(--vp-c-divider);
}

.forum-search-box.page-mode .forum-search-suggestion {
  min-height: 64px;
  border-radius: 0;
  padding: 10px 12px;
}

.forum-search-box.page-mode .forum-search-suggestion-title {
  font-size: calc(14px * var(--site-ui-scale));
}

.forum-search-suggestion-state {
  width: var(--forum-search-content-width, 100%);
  padding: 24px 12px;
  color: var(--vp-c-text-3);
  font-size: calc(13px * var(--site-ui-scale));
  text-align: center;
}

.forum-search-suggestions {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  width: max(100%, 320px);
  max-width: calc(100vw - 32px);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 6px;
  background: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-3);
}

.forum-search-suggestion {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 52px;
  border-radius: 6px;
  padding: 7px 10px;
  color: var(--vp-c-text-2);
  text-align: left;
}

.forum-search-suggestion-type {
  align-self: flex-start;
  margin-top: 4px;
}

.forum-search-suggestion-title {
  color: var(--vp-c-text-1);
  font-size: calc(13px * var(--site-ui-scale));
  line-height: calc(20px * var(--site-ui-scale));
}

.forum-search-suggestion-excerpt {
  margin-top: 1px;
  color: var(--vp-c-text-3);
  font-size: calc(12px * var(--site-ui-scale));
  line-height: calc(18px * var(--site-ui-scale));
}

.forum-search-suggestion:hover,
.forum-search-suggestion.active {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

input::-webkit-search-cancel-button {
  @apply i-lucide-x;
  appearance: none;
  cursor: pointer;
  width: 16px;
  height: 16px;
  background-color: var(--vp-c-text-1);
  border-radius: 50%;
  transition: background-color 150ms ease;
}

@media (prefers-reduced-motion: reduce) {
  input::-webkit-search-cancel-button {
    transition: none;
  }
}
</style>
