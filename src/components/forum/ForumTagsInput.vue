<template>
  <Popover>
    <PopoverTrigger>
      <TagsInput
        class="px-0 gap-0 w-full border vp-border-input"
        :model-value="modelValue"
      >
        <div class="flex gap-2 flex-wrap items-center px-3">
          <TagsInputItem v-for="item in modelValue" :key="item" :value="item">
            <TagsInputItemText />
            <TagsInputItemDelete />
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
                ? theme.forum.publish.tagsInput.maxTagsLimit
                : theme.forum.publish.tagsInput.searchTags
            "
          >
          </CommandInput>
          <CommandSeparator />
          <CommandList>
            <CommandEmpty>{{
              theme.forum.publish.tagsInput.noResultsFound
            }}</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem
                v-for="tag in filteredTags"
                :key="tag.value"
                :value="tag.label"
                :disabled="isDisabled"
                @select.prevent="handleSelect(tag)"
              >
                {{ tag.label }}
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
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
} from '@/components/ui/tags-input'
import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  Command,
  CommandInput,
  CommandSeparator,
} from '@/components/ui/command'
import { ComboboxRoot } from 'radix-vue'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { labels } from '@/apis/forum/gitee'
import { computed, onMounted, ref } from 'vue'
import { useVModel } from '@vueuse/core'

import type { HTMLAttributes } from 'vue'
import { useData } from 'vitepress'

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
const emits = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
})

const { theme } = useData()
const allowTags = <{ value: string; label: string }[]>[]
const searchTags = ref('')
const isDisabled = computed(() =>
  modelValue.value.length >= props.max ? true : false,
)
const filteredTags = computed(() =>
  allowTags.filter((i) => !modelValue.value.includes(i.label)),
)
const handleSelect = (tag: { value: string; label: string }) => {
  if (typeof tag.value === 'string') {
    searchTags.value = ''
    modelValue.value.push(tag.value)
  }

  if (filteredTags.value.length === 0) return
}

onMounted(async () => {
  const data = await labels.getAllLabelsName()

  data.map((val) => {
    if (['good-issue', 'test'].find((item) => item === val)) return

    allowTags.push({ value: val, label: val })
  })
})
</script>
