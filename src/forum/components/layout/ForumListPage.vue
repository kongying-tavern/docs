<script setup lang="ts">
import type ForumAPI from '~/forum/api/forum'
import type { ForumFilter, ForumSort, ForumTopicType } from '~/forum/services/forumRoute'
import { computed } from 'vue'
import Separator from '@/components/ui/separator/Separator.vue'
import ForumAside from '../aside/ForumAside.vue'
import ForumTopicList from '../list/ForumTopicList.vue'
import ForumTopicToolbar from '../list/ForumTopicToolbar.vue'
import ForumLoadState from '../ui/ForumLoadState.vue'
import ForumLayout from './ForumLayout.vue'

interface Props {
  renderData: ForumAPI.Topic[]
  loading?: boolean
  loadingMore?: boolean
  error?: Error | null
  canLoadMore?: boolean
  loadMore?: () => Promise<unknown> | unknown
  refreshData?: () => Promise<unknown> | unknown
  loadStateMessage?: string
  filter?: ForumFilter
  topicType?: ForumTopicType
  sort?: ForumSort
  query?: string
  onFilterChange?: (filter: ForumFilter) => Promise<unknown> | unknown
  onTypeChange?: (topicType: ForumTopicType) => Promise<unknown> | unknown
  onSortChange?: (sort: ForumSort) => Promise<unknown> | unknown
  onSearch?: (query: string) => Promise<unknown> | unknown
  showToolbar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  loadingMore: false,
  canLoadMore: false,
  loadStateMessage: 'Loading...',
  filter: 'all',
  topicType: 'all',
  sort: 'created',
  showToolbar: true,
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
        <template v-if="showToolbar">
          <ForumTopicToolbar
            :filter="filter"
            :topic-type="topicType"
            :sort="sort"
            :query="query"
            :suggestions="renderData"
            @filter-change="onFilterChange?.($event)"
            @type-change="onTypeChange?.($event)"
            @sort-change="onSortChange?.($event)"
            @search="onSearch?.($event)"
          />
          <Separator div class="mt-2" />
        </template>

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
          <ForumAside />
        </slot>
      </template>
    </ForumLayout>
  </ClientOnly>
</template>
