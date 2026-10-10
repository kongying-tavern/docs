<script setup lang="ts">
import { useLocalized } from '@/hooks/useLocalized'
import AsyncLoadError from '~/components/AsyncLoadError.vue'
import ForumTopicPageSkeleton from './ForumTopicPageSkeleton.vue'

defineProps<{ error?: Error }>()
const emit = defineEmits<{ retry: [] }>()
const { message } = useLocalized()
</script>

<template>
  <AsyncLoadError v-if="error" @retry="emit('retry')" />
  <div v-else data-async-loading aria-busy="true">
    <span class="sr-only" role="status">{{ message.ui.button.loading }}</span>
    <ForumTopicPageSkeleton aria-hidden="true" />
  </div>
</template>
