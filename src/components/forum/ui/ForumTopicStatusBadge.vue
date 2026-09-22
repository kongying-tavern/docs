<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { getTopicStatusColorClass } from '~/services/forum/forumTopicStatus'

const { status } = defineProps<{
  status?: ForumAPI.TopicDisplayStatus | 'good-issue'
}>()
</script>

<template>
  <span
    class="border border-black/15 rounded-[2px] shrink-0 size-12px inline-block dark:border-white/25"
    :class="status ? getTopicStatusColorClass(status) : 'bg-transparent border-dashed'"
    aria-hidden="true"
  />
</template>
