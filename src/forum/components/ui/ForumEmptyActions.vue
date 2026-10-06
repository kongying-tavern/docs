<script setup lang="ts">
import { EmptyActions } from '@/components/ui/empty'
</script>

<template>
  <EmptyActions class="forum-empty-actions">
    <slot />
  </EmptyActions>
</template>

<style scoped>
.forum-empty-actions :deep([data-slot='button']) {
  border-radius: 9999px;
}

.forum-empty-actions :deep([data-slot='button'][data-variant='outline']) {
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  box-shadow: none;
}
</style>
