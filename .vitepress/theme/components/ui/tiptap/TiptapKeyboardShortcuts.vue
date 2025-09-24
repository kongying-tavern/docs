<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { shortcuts } from './tiptapTreeUtils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="cn('tiptap-keyboard-shortcuts p-4', props.class)"
    data-slot="tiptap-keyboard-shortcuts"
  >
    <h3 class="mb-2 text-lg font-medium">
      Keyboard Shortcuts
    </h3>
    <div class="grid gap-2">
      <div v-for="(shortcut, index) in shortcuts" :key="index" class="flex items-center justify-between">
        <div class="flex gap-1">
          <kbd
            v-for="(key, kIndex) in shortcut.keys"
            :key="kIndex"
            class="border border-gray-200 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-800 font-semibold dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100"
          >
            {{ key }}
          </kbd>
        </div>
        <span class="text-sm text-muted-foreground">{{ shortcut.description }}</span>
      </div>
    </div>
  </div>
</template>
