<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { labels } from '@/apis/forum/gitee'
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
import { useVModel } from '@vueuse/core'

import { ComboboxRoot, PopoverPortal } from 'radix-vue'
import { computed, onMounted, ref } from 'vue'

import { getTopicTagLabelGetter } from '~/composables/getTopicTagLabelGetter'
import { getTopicTagMap } from '~/composables/getTopicTagMap'

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

const emits = defineEmits<(e: 'update:modelValue', value: string[]) => void>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
})

const { message } = useLocalized()
const topicTagMap = getTopicTagMap()
const topicTagLabelGetter = getTopicTagLabelGetter()

const tags = ref<string[]>([])
const searchTerm = ref('')

const isDisabled = computed(() =>
  modelValue.value.length >= props.max,
)
const filteredTags = computed(() =>
  tags.value.filter(i => !modelValue.value.includes(i)),
)

function getLocalizedTagName(key: string) {
  return topicTagMap.get(key)
    || topicTagMap.get(topicTagLabelGetter.getTag(key) ?? '')
    || key
}

function handleSelect(tag: string) {
  if (typeof tag === 'string') {
    searchTerm.value = ''
    modelValue.value.push(tag)
  }
}

function handleDelete(tag: string) {
  modelValue.value = modelValue.value.filter(i => i !== tag)
}

const tagList = computed(() => [
  {
    heading: 'Platforum',
    list: filteredTags.value.filter(val => val.includes('PLATFORM')),
  },
  {
    heading: 'Type',
    list: filteredTags.value.filter(val => !val.includes('PLATFORM')),
  },
])

onMounted(async () => {
  const data = await labels.getAllLabelsName()
  data
    .filter(label => topicTagLabelGetter.isLabel(label))
    .forEach((label) => {
      tags.value.push(label)
    })
})
</script>

<template>
  <Popover>
    <PopoverTrigger class="w-full">
      <TagsInput
        class="min-h-42px w-full gap-0 border px-0 vp-border-input"
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
        class="mt-2 w-[--radix-popper-anchor-width] data-[state=closed]:animate-out data-[state=open]:animate-in border rounded-md bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
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
