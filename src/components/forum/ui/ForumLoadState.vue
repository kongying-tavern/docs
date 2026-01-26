<script lang="ts" setup>
import { ReloadIcon } from '@radix-icons/vue'
import { Button } from '@/components/ui/button'

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
  <div class="mb-8 flex w-full justify-center">
    <Button
      v-if="loading"
      class="vp-link mt-8"
      variant="link"
    >
      <ReloadIcon
        class="mr-2 h-4 w-4"
        :class="loading ? 'animate-spin' : ''"
      />
      {{ text }}
    </Button>
    <Divider
      v-else
      variant="center"
      class="font-size-3 c-[var(--vp-c-text-3)] w-full"
    >
      {{ text }}
    </Divider>
  </div>
</template>
