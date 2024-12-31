<template>
  <div>
    <Button :disabled="loading" @click="onClick" v-bind="$attrs">
      <ReloadIcon class="w-4 h-4 mr-2 animate-spin" v-if="loading" />
      <slot></slot>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ReloadIcon } from '@radix-icons/vue'
import { ref, useAttrs } from 'vue'
import { Button } from './button'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()
const loading = ref(false)

const onClick = async () => {
  loading.value = true
  try {
    // @ts-ignore
    await attrs?.onClick?.()
  } finally {
    loading.value = false
  }
}
</script>
