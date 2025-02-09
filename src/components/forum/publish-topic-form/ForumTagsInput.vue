<template>
  <Popover>
    <PopoverTrigger class="w-full">
      <TagsInput
        class="min-h-42px px-0 gap-0 w-full border vp-border-input"
        v-bind="$attrs"
        :model-value="modelValue"
      >
        <div class="flex gap-2 flex-wrap items-center pl-3">
          <TagsInputItem
            v-for="item in modelValue"
            :key="item"
            :value="'#' + getLocalizedTagName(item)"
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
        class="w-[--radix-popper-anchor-width] rounded-md mt-2 border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
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
            >
            </CommandInput>
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

<script setup lang="ts">
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
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
} from '@/components/ui/tags-input'
import { ComboboxRoot, PopoverPortal } from 'radix-vue'

import { labels } from '@/apis/forum/gitee'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useVModel } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { getTopicTagMap } from '~/composables/getTopicTagMap'

import type { HTMLAttributes } from 'vue'
import { getTopicTagLabelGetter } from '~/composables/getTopicTagLabelGetter'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    max?: number
    modelValue: string[]
  }>(),
  {
    max: 5,
  },
)

const emits = defineEmits<(e: 'update:modelValue', value: string[]) => void>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
})

const { message } = useLocalized()
const topicTagMap = getTopicTagMap()
const topicTagLabelGetter = getTopicTagLabelGetter()

const tags = <string[]>[]
const searchTerm = ref('')

const isDisabled = computed(() =>
  modelValue.value.length >= props.max ? true : false,
)
const filteredTags = computed(() =>
  tags.filter((i) => !modelValue.value.includes(i)),
)

const getLocalizedTagName = (key: string) =>
  topicTagMap.get(key) ||
  topicTagMap.get(topicTagLabelGetter.getTag(key) ?? '') ||
  key

const handleSelect = (tag: string) => {
  if (typeof tag === 'string') {
    searchTerm.value = ''
    modelValue.value.push(tag)
  }
}

const handleDelete = (tag: string) => {
  modelValue.value = modelValue.value.filter((i) => i !== tag)
}

const tagList = computed(() => [
  {
    heading: 'Platforum',
    list: filteredTags.value.filter((val) => val.includes('PLATFORM')),
  },
  {
    heading: 'Type',
    list: filteredTags.value.filter((val) => !val.includes('PLATFORM')),
  },
])

onMounted(async () => {
  const data = await labels.getAllLabelsName()
  data
    .filter((label) => topicTagLabelGetter.isLabel(label))
    .forEach((label) => {
      tags.push(label)
    })
})
</script>
