<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useInfiniteScroll } from '@vueuse/core'
import { inject, onBeforeUpdate, shallowRef } from 'vue'
import ForumTopic from './ForumTopic.vue'
import ForumTopicListEmpty from './ForumTopicListEmpty.vue'
import ForumTopicListSkeletons from './ForumTopicListSkeletons.vue'
import { FORUM_TOPIC_CAN_LOAD_MORE } from './shared'

const {
  data,
  loadMore,
} = defineProps<{
  data: ForumAPI.Topic[]
  loadMore?: () => Promise<unknown> | unknown
  refreshData?: () => Promise<unknown> | unknown
  loading?: boolean
}>()

const canLoadMore = inject(FORUM_TOPIC_CAN_LOAD_MORE)

const itemStaggers = shallowRef(new Map<string, number>())

onBeforeUpdate(() => {
  const map = new Map(itemStaggers.value)
  let stagger = map.size
  for (const item of data) {
    if (!map.has(item.id))
      map.set(item.id, stagger++)
  }
  itemStaggers.value = map
})

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
      canLoadMore: () => canLoadMore?.value || false,
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
        :style="{ '--i': itemStaggers.get(item.id) ?? index }"
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
    transform 1120ms cubic-bezier(0.23, 1, 0.32, 1),
    opacity 1120ms cubic-bezier(0.23, 1, 0.32, 1);
  transition-delay: calc(var(--i) * 64ms);
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
.fade-enter-from > *,
.fade-enter-from > * * {
  opacity: 0;
  transition: opacity 600ms cubic-bezier(0.23, 1, 0.32, 1);
  transition-delay: calc(220ms + var(--i) * 190ms);
}

.fade-enter-to > *,
.fade-enter-to > * * {
  opacity: 1;
}

/* Reordering transition */
.fade-move {
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
</style>
