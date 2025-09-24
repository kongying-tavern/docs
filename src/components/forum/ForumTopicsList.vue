<script setup lang="ts">
import type { FORUM } from './types'
import type ForumAPI from '@/apis/forum/api'
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

.fade-move {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.fade-enter-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transition-delay: 0.02s;
}

.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.6, 1);
  position: absolute;
  width: 100%;
  opacity: 0;
}

.fade-enter-from {
  transform: translateX(15px) scale(0.98);
}

.fade-enter-to {
  transform: translateX(0) scale(1);
}

.fade-leave-from {
  transform: translateX(0) scale(1);
}

.fade-leave-to {
  transform: translateX(-15px) scale(0.95);
}

/* 文字内容的透明度过渡 */
.fade-enter-from * {
  opacity: 0;
  transition: opacity 0.25s ease-out;
  transition-delay: 0.08s;
}

.fade-enter-to * {
  opacity: 1;
}

.fade-leave-from * {
  opacity: 1;
  transition: opacity 0.12s ease-in;
}

.fade-leave-to * {
  opacity: 0;
}

/* 为不同元素添加微妙的延迟 */
.fade-enter-from .topic-title {
  transition-delay: 0.06s;
}

.fade-enter-from .topic-meta {
  transition-delay: 0.1s;
}
</style>
