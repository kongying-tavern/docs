<script lang="ts" setup>
import type { LabelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cn } from '../../../lib/utils.ts'
import { Label } from '../label/index.ts'
import { useFormField } from './useFormField.ts'

const props = defineProps<LabelProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class', 'for')

const { error, formItemId } = useFormField()
</script>

<template>
  <Label
    data-slot="form-label"
    :data-error="!!error"
    :class="cn(
      'data-[error=true]:text-destructive',
      props.class,
    )"
    :for="formItemId"
    v-bind="delegatedProps"
  >
    <slot />
  </Label>
</template>
