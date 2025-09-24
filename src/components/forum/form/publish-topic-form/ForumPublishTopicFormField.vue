<script setup lang="ts">
import { Label } from '@/components/ui/label'

const { required = false } = defineProps<{
  title: string
  required?: boolean
}>()
</script>

<template>
  <div class="w-full">
    <div class="w-full flex items-center justify-between px-1 first:mt-0">
      <Label
        class="mb-2 flex items-center justify-between text-[16px] font-medium leading-none hover:cursor-pointer peer-disabled:cursor-not-allowed sm:text-[16px] peer-disabled:opacity-70"
        :class="required ? 'required ml--2.5' : ''"
        v-bind="$attrs"
      >
        {{ title }}
      </Label>
    </div>

    <slot />
  </div>
</template>
