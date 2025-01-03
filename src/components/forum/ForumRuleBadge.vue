<template>
  <div class="inline-block" v-if="type">
    <span
      v-if="type === 'official'"
      class="inline-flex items-center rounded-md px-1.5 pb-0.5 pt-0.75 align-middle text-xs font-semibold transition-colors bg-[#c9353f1a] c-[#d8111b] ml-0.5 scale-80"
    >
      {{ message.forum.topic.official }}
    </span>
    <span
      v-if="type === 'author'"
      class="inline-flex items-center rounded-md px-1.5 pb-0.5 pt-0.75 align-middle text-xs font-semibold transition-colors bg-[#2c71ff1a] c-[#0056e3] ml-0.5 scale-80"
    >
      {{ message.forum.topic.author }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { useLocalized } from '@/hooks/useLocalized'

const { message } = useLocalized()

defineProps<{
  type: 'official' | 'author' | null
}>()
</script>
