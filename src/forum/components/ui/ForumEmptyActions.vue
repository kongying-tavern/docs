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
  min-inline-size: 9rem;
  padding-block: 0;
  border: 1px solid transparent;
  border-radius: 9999px;
}

.forum-empty-actions :deep([data-slot='button'][data-variant='outline']) {
  border-color: var(--vp-c-border);
  background: transparent;
  box-shadow: none;
}
</style>
