<template>
  <Popover>
    <PopoverTrigger>
      <TagsInput
        class="px-0 gap-0 w-full border vp-border-input"
        :model-value="modelValue"
      >
        <div class="flex gap-2 flex-wrap items-center px-3">
          <TagsInputItem
            v-for="item in modelValue"
            :key="item"
            :value="getLocalizedTagName(item)"
          >
            <TagsInputItemText />
            <TagsInputItemDelete @click="handleDelete(item)" />
          </TagsInputItem>
        </div>
        <TagsInputInput
          class="w-full px-3"
          :class="modelValue.length > 0 ? 'mt-2' : ''"
          @keydown.enter.prevent
        />
      </TagsInput>
    </PopoverTrigger>
    <PopoverContent>
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
            <CommandEmpty>{{
              message.forum.publish.tagsInput.noResultsFound
            }}</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem
                v-for="tag in filteredTags"
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
import { ComboboxRoot } from 'radix-vue'

import { labels } from '@/apis/forum/gitee'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useVModel } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { getTopicTagMap } from '../../composables/getTopicTagMap'

import type { HTMLAttributes } from 'vue'

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

const tags = <string[]>[]
const searchTerm = ref('')

const isDisabled = computed(() =>
  modelValue.value.length >= props.max ? true : false,
)
const filteredTags = computed(() =>
  tags.filter((i) => !modelValue.value.includes(i)),
)

const getLocalizedTagName = (key: string) => topicTagMap.get(key) || key

const handleSelect = (tag: string) => {
  if (typeof tag === 'string') {
    searchTerm.value = ''
    modelValue.value.push(tag)
  }
}

const handleDelete = (tag: string) => {
  modelValue.value = modelValue.value.filter((i) => i !== tag)
}

onMounted(async () => {
  const data = await labels.getAllLabelsName()

  data.map((val) => tags.push(val))
})
</script>
