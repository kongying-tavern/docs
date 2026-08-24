<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useInfiniteScroll } from '@vueuse/core'
import ForumTopic from './ForumTopic.vue'
import ForumTopicListEmpty from './ForumTopicListEmpty.vue'
import ForumTopicListSkeletons from './ForumTopicListSkeletons.vue'

const {
  data,
  loadMore,
  canLoadMore = false,
} = defineProps<{
  data: ForumAPI.Topic[]
  loadMore?: () => Promise<unknown> | unknown
  refreshData?: () => Promise<unknown> | unknown
  loading?: boolean
  canLoadMore?: boolean
}>()

// useInfiniteScroll should be called at setup top level, not inside onMounted
if (loadMore) {
  useInfiniteScroll(
    window,
    () => {
      loadMore()
    },
    {
      distance: 10,
      interval: 1500,
      canLoadMore: () => canLoadMore || false,
    },
  )
}
</script>

<template>
  <div>
    <TransitionGroup
      tag="ul"
      name="fade"
    >
      <li
        v-for="(item, index) in data"
        :key="item.id"
      >
        <ForumTopic :topic="item" />
        <Separator v-if="index < data.length - 1" class="h-1px" />
      </li>
    </TransitionGroup>

    <ForumTopicListSkeletons v-if="loading" />

    <ForumTopicListEmpty
      v-else-if="data.length === 0"
      class="my-8"
      :refresh-data="refreshData"
    />
  </div>
</template>

<style scoped>
.fade-enter-active {
  transition:
    transform 200ms ease-out,
    opacity 200ms ease-out;
}

.fade-leave-active {
  transition:
    transform 0.25s cubic-bezier(0.4, 0, 1, 1),
    opacity 0.25s cubic-bezier(0.4, 0, 1, 1);
}

.fade-enter-from {
  transform: translateX(148px);
  opacity: 0;
}

.fade-enter-to {
  transform: translateX(0);
  opacity: 1;
}

.fade-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.fade-leave-to {
  transform: translateX(-15px);
  opacity: 0;
}

/* Text content: starts hidden, fades in after the card slides in */
/* Reordering transition */
.fade-move {
  transition: transform 200ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .fade-move {
    transition: none;
  }
}
</style>
