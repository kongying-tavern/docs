<script setup lang="ts">
import { computed } from 'vue'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SettingsSelectOption {
  value: string
  label: string
  icon: string
}

const props = defineProps<{
  modelValue: string
  options: SettingsSelectOption[]
  ariaLabel: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const currentOption = computed(() => props.options.find(option => option.value === props.modelValue))

function updateValue(value: unknown): void {
  if (typeof value === 'string')
    emit('update:modelValue', value)
}
</script>

<template>
  <Select :model-value="modelValue" @update:model-value="updateValue">
    <SelectTrigger class="w-full" :aria-label="ariaLabel">
      <span class="select-option-icon" :class="currentOption?.icon" aria-hidden="true" />
      <SelectValue>{{ currentOption?.label }}</SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem v-for="option in options" :key="option.value" :value="option.value">
          <template #prefix>
            <span class="select-option-icon" :class="option.icon" aria-hidden="true" />
          </template>
          {{ option.label }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>

<style scoped>
.select-option-icon {
  flex: none;
  color: var(--vp-c-text-2);
  @apply text-base;
}
</style>
