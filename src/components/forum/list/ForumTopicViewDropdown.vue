<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select'
import { useLocalized } from '@/hooks/useLocalized'
import { FORUM_VIEW_MODES, getViewModeIconClass, useForumViewMode } from '~/composables/useForumViewMode'

const { viewMode, getViewModeIcon } = useForumViewMode()
const { message } = useLocalized()
</script>

<template>
  <Select v-model="viewMode">
    <SelectTrigger
      size="sm"
      class="font-size-3 rounded-full w-fit whitespace-break-spaces shadow-none hover:bg-[--vp-c-bg-soft]"
    >
      <span :class="getViewModeIcon" class="icon-btn bg-[--vp-c-text-2] size-4" />
    </SelectTrigger>
    <SelectContent>
      <SelectLabel>{{ message.forum.header.view.label }}</SelectLabel>
      <SelectItem v-for="mode in FORUM_VIEW_MODES" :key="mode" :value="mode">
        <span :class="getViewModeIconClass(mode)" class="icon-btn bg-[--vp-c-text-2] size-4" />
        {{ mode === 'CARD' ? message.forum.header.view.card : message.forum.header.view.compact }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
