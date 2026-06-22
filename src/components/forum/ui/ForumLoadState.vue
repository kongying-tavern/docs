<script lang="ts" setup>
import { ReloadIcon } from '@radix-icons/vue'
import { Button } from '@/components/ui/button'

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  canLoadMore: {
    type: Boolean,
    default: false,
  },
  text: {
    type: String,
    default: 'Loading...',
  },
  loadMore: {
    type: Function,
    default: undefined,
  },
})
</script>

<template>
  <div class="mb-8 flex w-full justify-center">
    <Button
      v-if="loading || canLoadMore"
      class="vp-link mt-8"
      variant="link"
      :disabled="loading"
      @click="loadMore?.()"
    >
      <ReloadIcon
        v-if="loading"
        class="mr-2 h-4 w-4"
        :class="{ 'animate-spin': loading }"
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
