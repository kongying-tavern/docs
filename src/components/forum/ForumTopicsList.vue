<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { FORUM } from './types'
import { useInfiniteScroll } from '@vueuse/core'
import { inject, onMounted } from 'vue'
import ForumTopic from './ForumTopic.vue'
import ForumTopicListSkeletons from './ForumTopicListSkeletons.vue'
import { FORUM_TOPIC_CAN_LOAD_MORE } from './shared'

const {
  data,
  loadMore,
  viewMode = 'Card',
} = defineProps<{
  data: ForumAPI.Topic[]
  viewMode?: FORUM.TopicViewMode
  loadMore?: () => Promise<unknown> | unknown
  loading?: boolean
}>()

const canLoadMore = inject(FORUM_TOPIC_CAN_LOAD_MORE)

onMounted(() => {
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
})
</script>

<template>
  <div>
    <KeepAlive>
      <TransitionGroup tag="ul" name="fade">
        <li v-for="item in data" :key="item.id">
          <ForumTopic :topic="item" :view-mode="viewMode" />
          <div class="vp-divider" />
        </li>
      </TransitionGroup>
    </KeepAlive>

    <ForumTopicListSkeletons v-if="loading" :view-mode="viewMode" />
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
