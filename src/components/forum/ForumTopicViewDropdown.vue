<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select'
import { inject } from 'vue'
import { FORUM_TOPIC_VIEW_MODE_KEY } from './shared'

const viewMode = inject(FORUM_TOPIC_VIEW_MODE_KEY)
</script>

<template>
  <Select v-model="viewMode">
    <SelectTrigger
      class="mt-2 w-fit whitespace-break-spaces rounded-full font-size-3 shadow-none hover:bg-[--vp-c-bg-soft]"
    >
      <span v-if="viewMode === 'Card'" class="i-custom-card icon-btn size-4 bg-[--vp-c-text-2]" />
      <span v-else class="i-custom-compact icon-btn size-4 bg-[--vp-c-text-2]" />
    </SelectTrigger>
    <SelectContent>
      <SelectLabel>View Mode</SelectLabel>
      <SelectItem value="Card">
        <span class="i-custom-card icon-btn size-4 bg-[--vp-c-text-2]" />
        Card
      </SelectItem>
      <SelectItem value="Compact">
        <span class="i-custom-compact icon-btn size-4 bg-[--vp-c-text-2]" />
        Compact
      </SelectItem>
    </SelectContent>
  </Select>
</template>
