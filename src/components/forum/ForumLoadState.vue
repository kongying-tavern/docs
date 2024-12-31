<template>
  <div class="flex justify-center w-full my-8">
    <Button class="vp-link" variant="link" v-if="loading">
      <ReloadIcon class="w-4 h-4 mr-2" :class="loading ? 'animate-spin' : ''" />
      {{ text }}
    </Button>
    <p v-else class="font-size-3 c-[var(--vp-c-text-3)]" variant="link">
      {{ text }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue'
import { Button } from '@/components/ui/button'
import { ReloadIcon } from '@radix-icons/vue'

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  text: {
    type: String,
    default: 'Loading...',
  },
})
</script>
