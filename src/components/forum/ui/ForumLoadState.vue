<script lang="ts" setup>
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

<template>
  <div class="my-8 w-full flex justify-center">
    <Button v-if="loading" class="vp-link" variant="link">
      <ReloadIcon class="mr-2 h-4 w-4" :class="loading ? 'animate-spin' : ''" />
      {{ text }}
    </Button>
    <p v-else class="font-size-3 c-[var(--vp-c-text-3)]" variant="link">
      {{ text }}
    </p>
  </div>
</template>
