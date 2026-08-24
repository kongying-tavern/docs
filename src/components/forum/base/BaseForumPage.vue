<script setup lang="ts">
import type { Component } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import type { ForumFilter, ForumSort } from '~/services/forum/forumRoute'
import { computed } from 'vue'
import ForumAside from '../ForumAside.vue'
import ForumLayout from '../ForumLayout.vue'
import ForumTopicMenubar from '../ForumTopicMenubar.vue'
import ForumTopicsList from '../ForumTopicsList.vue'
import ForumLoadState from '../ui/ForumLoadState.vue'

interface ForumAsideProps {
  showButton?: boolean
  contactUs?: boolean
}

interface Props {
  renderData: ForumAPI.Topic[] | ForumAPI.Post[]
  loading?: boolean
  loadingMore?: boolean
  error?: Error | null
  canLoadMore?: boolean
  loadMore?: () => Promise<unknown> | unknown
  refreshData?: () => Promise<unknown> | unknown
  loadStateMessage?: string
  showMenubar?: boolean
  showAside?: boolean
  headerComponent?: Component
  asideProps?: ForumAsideProps
  filter?: ForumFilter
  sort?: ForumSort
  onFilterChange?: (filter: ForumFilter) => Promise<unknown> | unknown
  onSortChange?: (sort: ForumSort) => Promise<unknown> | unknown
}

const props = withDefaults(defineProps<Props>(), {
  showMenubar: true,
  showAside: true,
  loading: false,
  loadingMore: false,
  canLoadMore: false,
  loadStateMessage: 'Loading...',
  asideProps: () => ({}),
  filter: 'all',
  sort: 'created',
})

const isInitialLoading = computed(() => props.loading && props.renderData.length === 0)
</script>

<template>
  <ClientOnly>
    <ForumLayout>
      <template #header>
        <component
          :is="headerComponent"
          v-if="headerComponent"
          v-bind="$attrs"
        />
        <slot name="header" />
      </template>

      <template #content>
        <slot name="content-before" />

        <ForumTopicMenubar
          v-if="showMenubar"
          :filter="filter"
          :sort="sort"
          @filter-change="onFilterChange?.($event)"
          @sort-change="onSortChange?.($event)"
        />
        <Separator
          v-if="showMenubar"
          div
          class="mt-2"
        />

        <slot name="content-main">
          <ForumTopicsList
            :data="renderData"
            :loading="isInitialLoading"
            :error="error"
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
            v-if="showAside"
            v-bind="asideProps"
          />
        </slot>
      </template>
    </ForumLayout>

    <slot name="teleport" />
  </ClientOnly>
</template>

<style scoped>
/* Add any base page specific styles here */
</style>
