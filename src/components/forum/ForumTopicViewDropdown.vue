<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select'
import { FORUM_VIEW_MODES, getViewModeDisplayLabel, getViewModeIconClass, useForumViewMode } from '~/composables/useForumViewMode'

const { viewMode, getViewModeIcon } = useForumViewMode()
</script>

<template>
  <Select v-model="viewMode">
    <SelectTrigger
      class="font-size-3 mt-2 rounded-full w-fit whitespace-break-spaces shadow-none hover:bg-[--vp-c-bg-soft]"
    >
      <span :class="getViewModeIcon" class="icon-btn bg-[--vp-c-text-2] size-4" />
    </SelectTrigger>
    <SelectContent>
      <SelectLabel>View Mode</SelectLabel>
      <SelectItem v-for="mode in FORUM_VIEW_MODES" :key="mode" :value="mode">
        <span :class="getViewModeIconClass(mode)" class="icon-btn bg-[--vp-c-text-2] size-4" />
        {{ getViewModeDisplayLabel(mode) }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
