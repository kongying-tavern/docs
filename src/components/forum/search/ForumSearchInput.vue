<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import { useRouter } from 'vitepress'
import { computed, nextTick, onMounted, ref, useId, useTemplateRef, watch } from 'vue'
import { Input } from '@/components/ui/input'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/composables/useForumRoute'
import { getForumSearchSuggestions } from '~/services/forum/forumSearchSuggestions'
import ForumTopicTypeBadge from '../ui/ForumTopicTypeBadge.vue'

const props = withDefaults(defineProps<{
  autofocus?: boolean
  class?: HTMLAttributes['class']
  suggestions?: ForumAPI.Topic[]
}>(), {
  suggestions: () => [],
})
const emit = defineEmits<{ submit: [query: string] }>()
const modelValue = defineModel<string>('query', { required: true })
const { message } = useLocalized()
const router = useRouter()
const { topicHref } = useForumRoute()
const inputId = `forum-search-${useId()}`
const listboxId = `${inputId}-suggestions`
const isOpen = ref(false)
const expanded = ref(false)
const activeIndex = ref(-1)

const inputEl = useTemplateRef<InstanceType<typeof Input>>('inputEl')
const triggerEl = ref<HTMLButtonElement>()
/** 触发器自然宽度：用于展开过渡起点（纯视觉，裁切风险由内容流+可溢出承担） */
const collapsedWidth = ref(96)

onMounted(() => {
  collapsedWidth.value = Math.ceil(triggerEl.value?.getBoundingClientRect().width ?? 96)
})

const filteredSuggestions = computed(() => {
  return getForumSearchSuggestions(props.suggestions, modelValue.value)
})
const showSuggestions = computed(() => isOpen.value && filteredSuggestions.value.length > 0)

watch(filteredSuggestions, () => activeIndex.value = -1)

const shouldExpand = computed(() => expanded.value || Boolean(modelValue.value.trim()))

function handleExpand() {
  expanded.value = true
  nextTick(() => inputEl.value?.focus())
}

function handleSearch() {
  isOpen.value = false
  emit('submit', modelValue.value.trim())
}

function moveActive(offset: number) {
  if (!showSuggestions.value) {
    isOpen.value = true
    return
  }

  activeIndex.value = (activeIndex.value + offset + filteredSuggestions.value.length)
    % filteredSuggestions.value.length
}

function selectActive() {
  const suggestion = filteredSuggestions.value[activeIndex.value]
  if (!suggestion)
    return handleSearch()

  isOpen.value = false
  router.go(topicHref(String(suggestion.topic.id), null))
}
</script>

<template>
  <form
    :class="[$props.class, { expanded: shouldExpand }]"
    :style="{ width: shouldExpand ? '224px' : `${collapsedWidth}px` }"
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
      @click="handleExpand"
    >
      <span
        class="i-lucide-search icon-btn bg-[var(--vp-c-text-2)] size-4"
        aria-hidden="true"
      />
      <span class="forum-search-trigger-text">{{ message.ui.button.search }}</span>
    </button>

    <template v-else>
      <div class="relative">
        <span
          class="i-lucide-search icon-btn bg-[var(--vp-c-text-2)] size-4 pointer-events-none left-2.5 top-1/2 absolute -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          :id="inputId"
          ref="inputEl"
          v-model.trim="modelValue"
          type="search"
          class="forum-search-input text-xs pl-8 pr-3.5 rounded-full h-8 shadow-none"
          :placeholder="message.ui.button.search"
          maxlength="50"
          :autofocus="autofocus"
          role="combobox"
          autocomplete="off"
          aria-autocomplete="list"
          :aria-controls="listboxId"
          :aria-expanded="showSuggestions"
          :aria-activedescendant="activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined"
          @focus="isOpen = true"
          @blur="isOpen = false; expanded = false"
          @input="isOpen = true"
          @keydown.down.prevent="moveActive(1)"
          @keydown.up.prevent="moveActive(-1)"
          @keydown.enter.prevent="selectActive"
          @keydown.esc="isOpen = false"
          @search="handleSearch"
        />
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
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 160ms ease;
}

.forum-search-trigger:hover {
  background: var(--vp-c-default-soft);
}

.forum-search-box :deep(.forum-search-input) {
  width: 100%;
}

.forum-search-box.expanded :deep(.forum-search-input) {
  background: var(--vp-c-default-soft);
}

.forum-search-input:hover {
  background: var(--vp-c-default-soft);
}

.forum-search-input:focus-visible {
  outline: none;
  background: transparent;
  box-shadow: none;
}

.forum-search-input:focus {
  background: transparent;
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
  font-size: 13px;
  line-height: 20px;
}

.forum-search-suggestion-excerpt {
  margin-top: 1px;
  color: var(--vp-c-text-3);
  font-size: 12px;
  line-height: 18px;
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
  transition: all 0.3s;
}

@media (prefers-reduced-motion: reduce) {
  input::-webkit-search-cancel-button {
    transition: none;
  }
}
</style>
