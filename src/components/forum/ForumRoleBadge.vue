<template>
  <div class="inline-block align-middle mb-1" v-if="rule">
    <span
      v-if="rule === 'official'"
      class="inline-flex items-center rounded-md px-1.5 pb-0.5 pt-0.75 align-middle text-xs font-semibold transition-colors bg-[#c9353f1a] c-[#d8111b] ml-0.5 scale-80"
    >
      {{ message.forum.topic.official }}
    </span>
    <span
      v-if="rule === 'author'"
      class="inline-flex items-center rounded-md px-1.5 pb-0.5 pt-0.75 align-middle text-xs font-semibold transition-colors bg-[#2c71ff1a] c-[#0056e3] ml-0.5 scale-80"
    >
      {{ message.forum.topic.author }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { useLocalized } from '@/hooks/useLocalized'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { isAuthor } from '~/composables/isAuthor'
import { computed } from 'vue'

const { message } = useLocalized()
const { isOfficial } = useRuleChecks()

let { authorId = null, type = null } = defineProps<{
  type?: 'official' | 'author' | null
  authorId?: string | number | null
}>()

const userRule = computed(() => {
  if (!authorId) return null
  if (isAuthor(authorId).value) return 'author'
  if (isOfficial(authorId).value) return 'official'
  return null
})

const rule = computed(() => type || userRule.value)
</script>
