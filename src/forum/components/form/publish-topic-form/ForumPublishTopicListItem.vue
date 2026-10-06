<script setup lang="ts">
import { ChevronRightIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Button type="button" variant="secondary" class="px-4 py-4 h-auto min-h-14 w-full justify-between srounded-lg">
    <span class="text-start flex gap-3 min-w-0 items-center">
      <slot />
    </span>
    <ChevronRightIcon class="shrink-0" data-icon="inline-end" aria-hidden="true" />
  </Button>
</template>
