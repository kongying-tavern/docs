<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AsyncLoadError from '~/components/AsyncLoadError.vue'
import ForumTopicPageSkeleton from './ForumTopicPageSkeleton.vue'

defineProps<{ error?: Error }>()
const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <AsyncLoadError v-if="error" @retry="emit('retry')" />
  <div v-else data-async-loading aria-busy="true">
    <span class="sr-only" role="status">{{ t('ui.button.loading') }}</span>
    <ForumTopicPageSkeleton aria-hidden="true" />
  </div>
</template>
