<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { ForumFilter, ForumSort } from '~/services/forum/forumRoute'
import { computed } from 'vue'
import ForumLayout from '../ForumLayout.vue'
import ForumTopicList from '../list/ForumTopicList.vue'
import ForumTopicToolbar from '../list/ForumTopicToolbar.vue'
import ForumAside from '../sidebar/ForumAside.vue'
import ForumLoadState from '../ui/ForumLoadState.vue'

interface Props {
  renderData: ForumAPI.Topic[] | ForumAPI.Post[]
  loading?: boolean
  loadingMore?: boolean
  error?: Error | null
  canLoadMore?: boolean
  loadMore?: () => Promise<unknown> | unknown
  refreshData?: () => Promise<unknown> | unknown
  loadStateMessage?: string
  filter?: ForumFilter
  sort?: ForumSort
  query?: string
  onFilterChange?: (filter: ForumFilter) => Promise<unknown> | unknown
  onSearch?: (query: string) => Promise<unknown> | unknown
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  loadingMore: false,
  canLoadMore: false,
  loadStateMessage: 'Loading...',
  filter: 'all',
  sort: 'created',
})

const isInitialLoading = computed(() => props.loading && props.renderData.length === 0)
</script>

<template>
  <ClientOnly>
    <ForumLayout>
      <template #header>
        <slot name="header" />
      </template>

      <template #content>
        <ForumTopicToolbar
          :filter="filter"
          :query="query"
          :suggestions="renderData"
          @filter-change="onFilterChange?.($event)"
          @search="onSearch?.($event)"
        />
        <Separator div class="mt-2" />

        <slot name="content-before" />

        <slot name="content-main">
          <ForumTopicList
            :data="renderData"
            :loading="isInitialLoading"
            :error="error"
            :query="query"
            :sort="sort"
            :load-more="loadMore"
            :refresh-data="refreshData"
            :can-load-more="canLoadMore"
          />

          <ForumLoadState
            v-if="renderData.length > 0"
            :loading="loadingMore"
            :error="Boolean(error)"
            :can-load-more="canLoadMore"
            :load-more="loadMore"
            :retry="refreshData"
            :text="loadStateMessage"
          />
        </slot>

        <slot name="content-after" />
      </template>

      <template #aside>
        <slot name="aside">
          <ForumAside
            :exclude-topic-ids="renderData.map(item => item.id)"
          />
        </slot>
      </template>
    </ForumLayout>

    <slot name="teleport" />
  </ClientOnly>
</template>
