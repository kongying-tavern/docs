<template>
  <div class="w-full">
    <div class="flex justify-between items-center w-full px-1 first:mt-0">
      <Label
        class="flex items-center justify-between text-[16px] font-medium leading-none hover:cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 sm:text-[16px] mb-2"
        :class="required ? 'required ml--2.5' : ''"
        v-bind="$attrs"
      >
        {{ title }}
      </Label>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
import { Label } from '@/components/ui/label'

const { required = false } = defineProps<{
  title: string
  required?: boolean
}>()
</script>
