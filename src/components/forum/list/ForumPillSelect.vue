<script setup lang="ts" generic="T extends string">
import { ChevronDown } from '@lucide/vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import ForumHintIcon from '../ui/ForumHintIcon.vue'
import ForumResponsiveSelect from '../ui/responsive/ForumResponsiveSelect.vue'
import { FORUM_SELECT_TRIGGER_CLASSES } from '../ui/responsive/shared'

const props = defineProps<{
  modelValue: T
  label: string
  options: ReadonlyArray<{ id: T, label: string, hint?: string }>
  ariaLabel?: string
}>()
const emit = defineEmits<{
  'change': [value: T]
  'update:modelValue': [value: T]
}>()

function handleUpdateModelValue(next: T) {
  if (next !== props.modelValue) {
    emit('update:modelValue', next)
    emit('change', next)
  }
}

const current = computed(() => props.options.find(option => option.id === props.modelValue))
const currentLabel = computed(() => current.value?.label ?? props.options[0]?.label ?? '')
const pillClasses = cn(
  FORUM_SELECT_TRIGGER_CLASSES,
  'font-size-3 rounded-full w-fit whitespace-nowrap shadow-none hover:bg-[--vp-c-bg-soft]',
)
</script>

<template>
  <ForumResponsiveSelect
    :model-value="props.modelValue"
    :options="props.options"
    :label="props.label"
    @update:model-value="handleUpdateModelValue"
  >
    <template #trigger>
      <button
        type="button"
        data-size="sm"
        :aria-label="ariaLabel"
        :class="pillClasses"
      >
        <span class="inline-flex gap-1 items-center">
          {{ currentLabel }}
          <ForumHintIcon v-if="current?.hint" :label="current.hint" />
        </span>
        <ChevronDown class="opacity-50 shrink-0 size-4" />
      </button>
    </template>
  </ForumResponsiveSelect>
</template>
