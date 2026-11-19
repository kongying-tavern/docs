<script setup lang="ts">
import { Kbd, KbdGroup } from '@theme/components/ui/kbd'
import { computed } from 'vue'

const props = defineProps<{ shortcut: string }>()
const keys = computed(() => props.shortcut.split('+').filter(Boolean))
</script>

<template>
  <span data-slot="forum-menu-shortcut" class="ml-auto pl-4 inline-flex shrink-0 justify-end" :aria-label="shortcut">
    <KbdGroup aria-hidden="true">
      <Kbd v-for="(key, index) in keys.length ? keys : [shortcut]" :key="index">{{ key }}</Kbd>
    </KbdGroup>
  </span>
</template>
