<script setup lang="ts">
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

defineOptions({
  inheritAttrs: false,
})

const { required = false } = defineProps<{
  title: string
  required?: boolean
}>()
</script>

<template>
  <FormItem class="form-field w-full space-y-2 md:pb-5">
    <div class="flex w-full items-center justify-between">
      <FormLabel
        class="text-sm leading-none font-medium flex items-center md:text-base peer-disabled:opacity-70 hover:cursor-pointer peer-disabled:cursor-not-allowed"
        :class="required ? 'required' : ''"
        v-bind="$attrs"
      >
        {{ title }}
      </FormLabel>
    </div>

    <FormControl class="w-full">
      <slot />
    </FormControl>
    <FormMessage class="text-xs" />
  </FormItem>
</template>
