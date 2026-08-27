<script setup lang="ts">
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { isAuthor } from '~/composables/isAuthor'
import { useRuleChecks } from '~/composables/useRuleChecks'

const { authorId = null, type = null } = defineProps<{
  type?: 'official' | 'author' | null
  authorId?: string | number | null
}>()
const { message } = useLocalized()
const { isOfficial } = useRuleChecks()

const userRole = computed(() => {
  if (!authorId)
    return null
  if (isAuthor(authorId).value)
    return 'author'
  if (isOfficial(authorId).value)
    return 'official'
  return null
})

const role = computed(() => type || userRole.value)
</script>

<template>
  <div v-if="role" class="mb-1 align-middle inline-block">
    <span
      v-if="role === 'official'"
      class="text-xs text-[var(--forum-role-official-text)] font-semibold ml-0.5 px-1.5 pb-0.5 pt-0.75 align-middle rounded-md bg-[var(--forum-role-official-bg)] inline-flex scale-80 transition-colors items-center"
    >
      {{ message.forum.topic.official }}
    </span>
    <span
      v-if="role === 'author'"
      class="text-xs text-[var(--forum-role-author-text)] font-semibold ml-0.5 px-1.5 pb-0.5 pt-0.75 align-middle rounded-md bg-[var(--forum-role-author-bg)] inline-flex scale-80 transition-colors items-center"
    >
      {{ message.forum.topic.author }}
    </span>
  </div>
</template>
