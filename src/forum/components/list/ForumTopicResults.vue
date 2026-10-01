<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { GiteeAPIError } from '~/forum/api/gitee'
import ForumLoadState from '../ui/ForumLoadState.vue'
import ForumTopicList from './ForumTopicList.vue'

defineProps<{
  data: ForumAPI.Topic[]
  loading?: boolean
  loadingMore?: boolean
  error?: Error | null
  canLoadMore?: boolean
  loadMore?: () => Promise<unknown> | unknown
  refreshData?: () => Promise<unknown> | unknown
  query?: string
  sort?: ForumAPI.SortMethod
  text?: string
}>()
const emit = defineEmits<{ login: [] }>()
</script>

<template>
  <div>
    <ForumTopicList
      :data="data"
      :loading="loading"
      :error="error"
      :query="query"
      :sort="sort"
      :load-more="loadMore"
      :refresh-data="refreshData"
      :can-load-more="canLoadMore"
    />

    <ForumLoadState
      v-if="data.length > 0"
      :loading="loading || loadingMore"
      :error="Boolean(error)"
      :rate-limit="error instanceof GiteeAPIError && error.isExceededRateLimit()"
      :error-message="error?.message ?? ''"
      :can-load-more="canLoadMore"
      :load-more="loadMore"
      :retry="refreshData"
      :text="text"
      @login="emit('login')"
    />
  </div>
</template>
