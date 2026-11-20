<script setup lang="ts">
import type ForumAPI from '@/src/forum/api/types.d.ts'
import { getTopicStatusColorClass } from '@/src/forum/services/forumTopicStatus.ts'

const { status } = defineProps<{
  status?: ForumAPI.TopicDisplayStatus | 'good-issue'
}>()
</script>

<template>
  <span
    class="border border-black/15 rounded-[2px] shrink-0 inline-block size-12px dark:border-white/25"
    :class="status ? getTopicStatusColorClass(status) : 'bg-transparent border-dashed'"
    aria-hidden="true"
  />
</template>
