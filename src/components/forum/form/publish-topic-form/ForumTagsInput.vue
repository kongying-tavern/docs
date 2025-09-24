<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { ComboboxRoot, PopoverPortal } from 'radix-vue'
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
import { useTagsInput } from '../composables/useTagsInput'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    max?: number
    modelValue: string[]
    placeholder?: string
  }>(),
  {
    max: 5,
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
  modelValue: modelValue.value,
  max: props.max,
})
</script>

<template>
  <Popover>
    <PopoverTrigger class="w-full">
      <TagsInput
        class="min-h-42px w-full gap-0 border vp-border-input px-0"
        v-bind="$attrs"
        :model-value="modelValue"
        :placeholder="placeholder"
      >
        <div class="flex flex-wrap items-center gap-2 pl-3">
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
        <TagsInputInput class="w-full px-3" @keydown.enter.prevent />
      </TagsInput>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        class="mt-2 w-[--radix-popper-anchor-width] border rounded-md bg-popover text-popover-foreground shadow-md outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
      >
        <ComboboxRoot>
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
        </ComboboxRoot>
      </PopoverContent>
    </PopoverPortal>
  </Popover>
</template>
