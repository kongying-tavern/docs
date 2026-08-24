<script setup lang="ts">
import type { Component } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import { computed, provide, toRef } from 'vue'
import ForumAside from '../ForumAside.vue'
import ForumLayout from '../ForumLayout.vue'
import ForumTopicMenubar from '../ForumTopicMenubar.vue'
import ForumTopicsList from '../ForumTopicsList.vue'
import { FORUM_TOPIC_LOADING_KEY } from '../shared'
import ForumLoadState from '../ui/ForumLoadState.vue'

// 导入BroadcastChannelSync以确保模块初始化
import '~/services/events/BroadcastChannelSync'

interface ForumAsideProps {
  showButton?: boolean
  contactUs?: boolean
}

interface Props {
  renderData: ForumAPI.Topic[] | ForumAPI.Post[]
  loading?: boolean
  loadingMore?: boolean
  canLoadMore?: boolean
  loadMore?: () => Promise<unknown> | unknown
  refreshData?: () => Promise<unknown> | unknown
  loadStateMessage?: string
  showMenubar?: boolean
  showAside?: boolean
  headerComponent?: Component
  asideProps?: ForumAsideProps
}

const props = withDefaults(defineProps<Props>(), {
  showMenubar: true,
  showAside: true,
  loading: false,
  loadingMore: false,
  canLoadMore: false,
  loadStateMessage: 'Loading...',
  asideProps: () => ({}),
})

const isTopicsLoading = computed(() => props.loading || props.loadingMore)
provide(FORUM_TOPIC_LOADING_KEY, toRef(props, 'loading'))
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

        <ForumTopicMenubar v-if="showMenubar" />
        <Separator
          v-if="showMenubar"
          div
          class="mt-2"
        />

        <slot name="content-main">
          <ForumTopicsList
            :data="renderData"
            :loading="isTopicsLoading"
            :load-more="loadMore"
            :refresh-data="refreshData"
            :can-load-more="canLoadMore"
          />

          <ForumLoadState
            :loading="isTopicsLoading"
            :can-load-more="canLoadMore"
            :load-more="loadMore"
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
