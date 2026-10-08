<script setup lang="ts">
import type { ForumSelectOption, ForumSelectSlots } from './shared'
import { SelectTrigger } from 'reka-ui'
import { computed } from 'vue'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/select'
import ForumHintIcon from '../ForumHintIcon.vue'
import { groupSelectOptions } from './shared'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  options: ReadonlyArray<ForumSelectOption>
  /** 根分组的标题；缺省则不显示根组标题 */
  label?: string
}>()

defineSlots<ForumSelectSlots>()

const modelValue = defineModel<string>({ required: true })

const groups = computed(() => groupSelectOptions(props.options))

function handleValueChange(next: unknown) {
  if (typeof next === 'string')
    modelValue.value = next
}
</script>

<template>
  <Select :model-value="modelValue" @update:model-value="handleValueChange">
    <!-- 直接用 reka 的 SelectTrigger：ui/select 包装版自带 SelectIcon，
        与 as-child 组合会多渲染一个箭头（reka Slot 会保留全部子节点） -->
    <SelectTrigger as-child>
      <slot name="trigger" />
    </SelectTrigger>
    <SelectContent fluid class="min-w-full">
      <template v-for="(group, groupIndex) in groups" :key="groupIndex">
        <SelectGroup>
          <SelectLabel v-if="group.label ?? label">
            {{ group.label ?? label }}
          </SelectLabel>
          <SelectItem
            v-for="option in group.items"
            :key="option.id"
            :value="option.id"
            :disabled="option.disabled"
          >
            <template #prefix>
              <slot name="prefix" :option="option" />
            </template>
            <span class="inline-flex gap-1 items-center">
              {{ option.label }}
              <ForumHintIcon v-if="option.hint" :label="option.hint" />
            </span>
          </SelectItem>
        </SelectGroup>
        <SelectSeparator v-if="groupIndex < groups.length - 1" />
      </template>
    </SelectContent>
  </Select>
</template>
