<script setup lang="ts">
import { useLocalized } from '@/hooks/useLocalized'
import { computed } from 'vue'
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
  <div v-if="role" class="mb-1 inline-block align-middle">
    <span
      v-if="role === 'official'"
      class="ml-0.5 inline-flex scale-80 items-center rounded-md bg-[#c9353f1a] px-1.5 pb-0.5 pt-0.75 align-middle text-xs c-[#d8111b] font-semibold transition-colors"
    >
      {{ message.forum.topic.official }}
    </span>
    <span
      v-if="role === 'author'"
      class="ml-0.5 inline-flex scale-80 items-center rounded-md bg-[#2c71ff1a] px-1.5 pb-0.5 pt-0.75 align-middle text-xs c-[#0056e3] font-semibold transition-colors"
    >
      {{ message.forum.topic.author }}
    </span>
  </div>
</template>
