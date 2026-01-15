<script setup lang="ts">
import { Label } from '@/components/ui/label'

defineOptions({
  inheritAttrs: false,
})

const { required = false } = defineProps<{
  title: string
  required?: boolean
}>()
</script>

<template>
  <div class="border-b border-color-[var(--vp-c-border)] w-full not-last:border-b-solid">
    <div class="px-1 flex w-full items-center justify-between first:mt-0">
      <Label
        class="text-[16px] leading-none font-medium mb-2 flex items-center justify-between sm:text-[16px] peer-disabled:opacity-70 hover:cursor-pointer peer-disabled:cursor-not-allowed"
        :class="required ? 'required ml--2.5' : ''"
        v-bind="$attrs"
      >
        {{ title }}
      </Label>
    </div>

    <div class="w-full">
      <slot />
    </div>
  </div>
</template>
