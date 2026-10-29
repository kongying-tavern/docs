<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
} from '@/components/ui/tags-input'
import { VALIDATION_LIMITS } from '~/forum/services/forumConfig'
import { useTagsInput } from '../composables/useTagsInput'

const { max = VALIDATION_LIMITS.TAGS.MAX_COUNT } = defineProps<{
  class?: HTMLAttributes['class']
  max?: number
  placeholder?: string
}>()

const modelValue = defineModel<string[]>({ default: () => [] })

const { t } = useI18n({ useScope: 'global' })

const {
  isDisabled,
  isLoading,
  loadError,
  filteredTags,
  tagList,
  getLocalizedTagName,
  handleSelect,
  handleDelete,
  loadTags,
} = useTagsInput({
  modelValue,
  max,
})
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <TagsInput
        class="letter-tags-input px-3 border vp-border-input gap-2 min-h-42px w-full md:px-0 md:gap-0"
        v-bind="$attrs"
        :model-value="modelValue"
        :placeholder="placeholder"
      >
        <div v-if="modelValue.length" class="contents md:pl-3 md:flex md:flex-wrap md:gap-2 md:items-center">
          <TagsInputItem
            v-for="item in modelValue"
            :key="item"
            :value="`#${getLocalizedTagName(item)}`"
            @dblclick="handleDelete(item)"
          >
            <TagsInputItemText />
            <TagsInputItemDelete @click="handleDelete(item)" />
          </TagsInputItem>
        </div>
        <TagsInputInput class="px-0 min-w-24 w-auto md:px-3 md:w-full" :placeholder="placeholder" @keydown.enter.prevent />
      </TagsInput>
    </PopoverTrigger>
    <PopoverContent
      class="text-popover-foreground mt-2 outline-none border rounded-md bg-popover w-[--reka-popover-trigger-width] shadow-md"
    >
      <Command>
        <CommandInput
          :disabled="isDisabled"
          :placeholder="
            isDisabled
              ? t('forum.publish.tagsInput.maxTagsLimit')
              : t('forum.publish.tagsInput.searchTags')
          "
        />
        <CommandSeparator />
        <CommandList>
          <div v-if="isLoading" class="text-sm c-[var(--vp-c-text-2)] px-3 py-5 flex gap-2 items-center justify-center">
            <span class="i-lucide-loader-circle size-4 animate-spin" aria-hidden="true" />
            {{ t('forum.publish.tagsInput.loading') }}
          </div>
          <div v-else-if="loadError" class="text-sm px-3 py-4 flex flex-col gap-2 items-center" role="alert">
            <span>{{ t('forum.publish.tagsInput.loadFailed') }}</span>
            <button type="button" class="text-[var(--vp-c-brand-1)] hover:underline" @click="loadTags">
              {{ t('forum.publish.tagsInput.retry') }}
            </button>
          </div>
          <p v-else-if="filteredTags.length === 0" class="text-sm py-6 text-center" role="status">
            {{ t('forum.publish.tagsInput.noResultsFound') }}
          </p>
          <CommandEmpty v-else>
            {{ t('forum.publish.tagsInput.noResultsFound') }}
          </CommandEmpty>

          <template v-if="!isLoading && !loadError">
            <CommandGroup
              v-for="item in tagList"
              :key="item.heading"
              :heading="item.heading"
            >
              <CommandItem
                v-for="tag in item.list"
                :key="tag"
                :value="getLocalizedTagName(tag)"
                :disabled="isDisabled"
                @select.prevent="handleSelect(tag)"
              >
                {{ getLocalizedTagName(tag) }}
              </CommandItem>
            </CommandGroup>
          </template>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
