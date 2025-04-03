<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { FORUM } from './types'
import { useInfiniteScroll } from '@vueuse/core'
import ForumTopic from './ForumTopic.vue'

const { dataLoader: fetchData, loadMore, canLoadMore, data, viewMode = 'Card' } = defineProps<{
  data: ForumAPI.Topic[]
  viewMode?: FORUM.TopicViewMode
  dataLoader?: () => Promise<unknown>
  loadMore?: () => Promise<unknown> | unknown
  canLoadMore?: boolean
}>()

if (!import.meta.env.SSR && fetchData)
  await fetchData()

if (!import.meta.env.SSR && loadMore && canLoadMore) {
  useInfiniteScroll(
    window,
    () => {
      loadMore()
    },
    {
      distance: 10,
      interval: 1500,
      canLoadMore: () => canLoadMore,
    },
  )
}
</script>

<template>
  <div>
    <TransitionGroup tag="ul" name="fade">
      <li v-for="item in data" :key="item.id">
        <ForumTopic
          :topic="item"
          :view-mode="viewMode"
        />
        <div class="vp-divider" />
      </li>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.container {
  position: relative;
  padding: 0;
  list-style-type: none;
}

.item {
  width: 100%;
  height: 30px;
  background-color: #f3f3f3;
  border: 1px solid #666;
  box-sizing: border-box;
}

.fade-move,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scaleY(0.01) translate(30px, 0);
}

.fade-leave-active {
  position: absolute;
}
</style>
