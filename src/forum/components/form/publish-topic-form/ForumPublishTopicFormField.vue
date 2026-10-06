<script setup lang="ts">
import { useFieldError } from 'vee-validate'
import { Field } from '@/components/ui/field'
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

defineOptions({
  inheritAttrs: false,
})

const { required = false } = defineProps<{
  title: string
  required?: boolean
}>()
const error = useFieldError()
</script>

<template>
  <FormItem class="form-field w-full md:pb-5">
    <Field class="gap-2" :data-invalid="Boolean(error)">
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
    </Field>
  </FormItem>
</template>
