<script setup lang="ts">
import type { ForumSelectOption } from './shared'
import { useMediaQuery } from '@vueuse/core'
import { defineAsyncComponent } from 'vue'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/forum/services/forumConfig'

const props = defineProps<{
  options: ReadonlyArray<ForumSelectOption>
  /** 根分组的标题，作为桌面端列表内的分组标题；缺省则不显示根组标题 */
  label?: string
  /** 移动端抽屉标题；缺省回退到 label */
  title?: string
}>()
const emit = defineEmits<{
  change: [value: string]
}>()
defineSlots<{
  /** 触发按钮内容（完整按钮元素），桌面与移动端共用同一份标记 */
  trigger: () => unknown
  /** 选项行前缀，如状态色块 */
  prefix: (props: { option: ForumSelectOption }) => unknown
}>()
const modelValue = defineModel<string>({ required: true })
const ForumSelectDesktop = defineAsyncComponent(() => import('./ForumSelectDesktop.vue'))
const ForumSelectMobileDrawer = defineAsyncComponent(() => import('./ForumSelectMobileDrawer.vue'))

const isMobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)

function handleUpdateModelValue(next: string) {
  if (next !== modelValue.value) {
    modelValue.value = next
    emit('change', next)
  }
}
</script>

<template>
  <ForumSelectDesktop
    v-if="!isMobile"
    :model-value="modelValue"
    :options="props.options"
    :label="props.label"
    @update:model-value="handleUpdateModelValue"
  >
    <template #trigger>
      <slot name="trigger" />
    </template>
    <template #prefix="{ option }">
      <slot name="prefix" :option="option" />
    </template>
  </ForumSelectDesktop>

  <ForumSelectMobileDrawer
    v-else
    :model-value="modelValue"
    :options="props.options"
    :label="title ?? label ?? ''"
    @update:model-value="handleUpdateModelValue"
  >
    <template #trigger>
      <slot name="trigger" />
    </template>
    <template #prefix="{ option }">
      <slot name="prefix" :option="option" />
    </template>
  </ForumSelectMobileDrawer>
</template>
