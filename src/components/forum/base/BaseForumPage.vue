<script setup lang="ts">
import type { Component } from 'vue'
import type { FORUM } from '../types'
import type ForumAPI from '@/apis/forum/api'
import type { ForumStore } from '~/types/forum/simplified'
import { useLocalStorage } from '@vueuse/core'
import { computed, provide, toRef } from 'vue'
import ForumAside from '../ForumAside.vue'
import ForumLayout from '../ForumLayout.vue'
import ForumTopicMenubar from '../ForumTopicMenubar.vue'
import ForumTopicsList from '../ForumTopicsList.vue'
import { FORUM_STORE_KEY, FORUM_TOPIC_CAN_LOAD_MORE, FORUM_TOPIC_FILTER_KEY, FORUM_TOPIC_LOADING_KEY, FORUM_TOPIC_SORT_KEY, FORUM_TOPIC_VIEW_MODE_KEY, FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY } from '../shared'
import ForumLoadState from '../ui/ForumLoadState.vue'

interface ForumAsideProps {
  showButton?: boolean
  contactUs?: boolean
}

interface Props {
  store: ForumStore
  renderData: ForumAPI.Topic[] | ForumAPI.Post[]
  showMenubar?: boolean
  showAside?: boolean
  headerComponent?: Component
  asideProps?: ForumAsideProps
}

const props = withDefaults(defineProps<Props>(), {
  showMenubar: true,
  showAside: true,
  asideProps: () => ({}),
})

// View mode with localStorage persistence
const viewMode = useLocalStorage<FORUM.TopicViewMode>(FORUM_TOPIC_VIEW_MODE_LOCALE_STORE_KEY, 'Card')

// Access store properties directly (don't destructure to maintain reactivity)
const store = props.store

// Provide context for child components using toRef to maintain reactivity
provide(FORUM_TOPIC_VIEW_MODE_KEY, viewMode)
provide(FORUM_TOPIC_SORT_KEY, toRef(store, 'sort'))
provide(FORUM_TOPIC_FILTER_KEY, toRef(store, 'filter'))
provide(FORUM_TOPIC_LOADING_KEY, toRef(store, 'loading'))
provide(FORUM_TOPIC_CAN_LOAD_MORE, toRef(store, 'canLoadMore'))
provide(FORUM_STORE_KEY, store)
provide('searchTopics', store.searchTopics)

// Loading state for topics list
const isTopicsLoading = computed(() => {
  // store.loading is already a reactive value, don't use .value
  return typeof store.loading === 'boolean' ? store.loading : store.loading?.value || false
})
</script>

<template>
  <ClientOnly>
    <ForumLayout>
      <template #header>
        <component :is="headerComponent" v-if="headerComponent" v-bind="$attrs" />
        <slot name="header" />
      </template>

      <template #content>
        <slot name="content-before" />

        <ForumTopicMenubar v-if="showMenubar" />
        <div v-if="showMenubar" class="mt-2 vp-divider" />

        <slot name="content-main">
          <ForumTopicsList
            :view-mode="viewMode"
            :data="renderData"
            :loading="isTopicsLoading"
            :load-more="store.loadMoreTopics"
          />

          <ForumLoadState :loading="isTopicsLoading" :text="store.loadStateMessage" />
        </slot>

        <slot name="content-after" />
      </template>

      <template #aside>
        <slot name="aside">
          <ForumAside v-if="showAside" v-bind="asideProps" />
        </slot>
      </template>
    </ForumLayout>

    <slot name="teleport" />
  </ClientOnly>
</template>

<style scoped>
/* Add any base page specific styles here */
</style>
