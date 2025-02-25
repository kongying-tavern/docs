<script setup lang="ts">
import { ReloadIcon } from '@radix-icons/vue'
import { ref, useAttrs } from 'vue'

import { Button } from './button'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()
const loading = ref(false)

async function onClick() {
  loading.value = true
  try {
    if (typeof attrs?.onClick === 'function') {
      await attrs.onClick()
    }
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <Button :disabled="loading" v-bind="$attrs" @click="onClick">
      <ReloadIcon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
      <slot />
    </Button>
  </div>
</template>
