<script setup lang="ts">
import type { SuggestionKeyDownProps } from '@tiptap/suggestion'
import type { ForumEditorSuggestionItem } from '~/composables/tiptap/forumSuggestionRenderer'
import { ref, watch } from 'vue'
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useLocalized } from '@/hooks/useLocalized'
import ForumTopicTypeBadge from '../ui/ForumTopicTypeBadge.vue'

const props = defineProps<{
  items: ForumEditorSuggestionItem[]
  command: (item: ForumEditorSuggestionItem) => void
}>()

const selectedIndex = ref(0)
const { message } = useLocalized()

watch(() => props.items, () => {
  selectedIndex.value = 0
})

function select(index: number): void {
  const item = props.items[index]
  if (item)
    props.command(item)
}

function onKeyDown({ event }: SuggestionKeyDownProps): boolean {
  const count = props.items.length
  if (!count || !['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key))
    return false
  event.preventDefault()
  if (event.key === 'Enter')
    select(selectedIndex.value)
  else
    selectedIndex.value = (selectedIndex.value + (event.key === 'ArrowDown' ? 1 : -1) + count) % count
  return true
}

defineExpose({ onKeyDown })
</script>

<template>
  <Command class="forum-editor-suggestions">
    <CommandList>
      <p v-if="items.length === 0" class="text-sm text-[var(--vp-c-text-3)] p-4 text-center">
        {{ message.forum.publish.tagsInput.noResultsFound }}
      </p>
      <CommandGroup>
        <CommandItem
          v-for="(item, index) in items"
          :key="item.id"
          :value="String(item.id)"
          as-child
          class="forum-editor-suggestion-item"
          :class="{ 'bg-[var(--vp-c-default-soft)]': selectedIndex === index }"
          @pointerenter="selectedIndex = index"
        >
          <button
            type="button"
            class="forum-editor-suggestion-button"
            @pointerdown.stop.prevent="select(index)"
          >
            <img
              v-if="item.kind === 'user' && item.avatar"
              :src="item.avatar"
              alt=""
              class="forum-editor-suggestion-avatar"
            >
            <ForumTopicTypeBadge
              v-else-if="item.kind === 'topic'"
              :type="item.topicType"
              icon-only
              class="forum-editor-suggestion-type"
            />
            <span class="leading-tight flex flex-1 flex-col min-w-0">
              <strong class="text-sm font-medium truncate">{{ item.label }}</strong>
              <span v-if="item.description" class="text-xs text-[var(--vp-c-text-3)] truncate">
                {{ item.description }}
              </span>
            </span>
          </button>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
</template>

<style scoped>
.forum-editor-suggestions {
  --forum-suggestion-scrollbar: color-mix(in srgb, var(--vp-c-text-3) 44%, transparent);
  --forum-suggestion-scrollbar-hover: color-mix(in srgb, var(--vp-c-text-2) 64%, transparent);

  width: min(320px, calc(100vw - 24px));
  max-height: min(280px, calc(100dvh - 24px));
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-3);
}

:deep([data-slot='command-list']) {
  max-height: min(280px, calc(100dvh - 24px));
  overscroll-behavior: contain;
  scrollbar-color: var(--forum-suggestion-scrollbar) transparent;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
}

:deep([data-slot='command-list']::-webkit-scrollbar) {
  width: 10px;
}

:deep([data-slot='command-list']::-webkit-scrollbar-track) {
  background: transparent;
}

:deep([data-slot='command-list']::-webkit-scrollbar-thumb) {
  border: 2px solid transparent;
  border-radius: 999px;
  background: var(--forum-suggestion-scrollbar);
  background-clip: padding-box;
}

:deep([data-slot='command-list']::-webkit-scrollbar-thumb:hover) {
  background: var(--forum-suggestion-scrollbar-hover);
  background-clip: padding-box;
}

.forum-editor-suggestion-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
}

.forum-editor-suggestion-avatar {
  width: 24px;
  height: 24px;
  flex: none;
  border-radius: 50%;
  object-fit: cover;
}

.forum-editor-suggestion-type {
  margin-inline: 5px 7px;
  flex: none;
}
</style>
