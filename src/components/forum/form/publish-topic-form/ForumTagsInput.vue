<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
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
import { useLocalized } from '@/hooks/useLocalized'
import { VALIDATION_LIMITS } from '../../constants'
import { useTagsInput } from '../composables/useTagsInput'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    max?: number
    modelValue: string[]
    placeholder?: string
  }>(),
  {
    max: VALIDATION_LIMITS.TAGS.MAX_COUNT,
  },
)

const emits = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
})

const { message } = useLocalized()

// Use tags input composable
const {
  isDisabled,
  tagList,
  getLocalizedTagName,
  handleSelect,
  handleDelete,
} = useTagsInput({
  modelValue,
  max: props.max,
})
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <TagsInput
        class="px-0 border vp-border-input gap-0 min-h-42px w-full"
        v-bind="$attrs"
        :model-value="modelValue"
        :placeholder="placeholder"
      >
        <div class="pl-3 flex flex-wrap gap-2 items-center">
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
        <TagsInputInput class="px-3 w-full" @keydown.enter.prevent />
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
              ? message.forum.publish.tagsInput.maxTagsLimit
              : message.forum.publish.tagsInput.searchTags
          "
        />
        <CommandSeparator />
        <CommandList>
          <CommandEmpty>
            {{ message.forum.publish.tagsInput.noResultsFound }}
          </CommandEmpty>

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
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
