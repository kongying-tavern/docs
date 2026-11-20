<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils.ts'
import { useFormField } from './useFormField.ts'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { formDescriptionId } = useFormField()
</script>

<template>
  <p
    :id="formDescriptionId"
    data-slot="form-description"
    :class="cn('text-muted-foreground text-sm', props.class)"
  >
    <slot />
  </p>
</template>
