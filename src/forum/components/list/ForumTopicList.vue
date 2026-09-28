<script setup lang="ts">
import type ForumAPI from '~/forum/api/forum'
import { useInfiniteScroll } from '@vueuse/core'
import { computed, ref } from 'vue'
import Divider from '@/components/ui/divider/Divider.vue'
import Separator from '@/components/ui/separator/Separator.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { beginForumVisit, findLastVisitedDividerIndex } from '~/forum/services/forumLastVisit'
import ForumTopicPreviewDialog from '../topic/ForumTopicPreviewDialog.vue'
import ForumTopic from './ForumTopic.vue'
import ForumTopicListEmpty from './ForumTopicListEmpty.vue'
import ForumTopicListSkeletons from './ForumTopicListSkeletons.vue'

const {
  data,
  loadMore,
  canLoadMore = false,
  sort = 'created',
} = defineProps<{
  data: ForumAPI.Topic[]
  loadMore?: () => Promise<unknown> | unknown
  refreshData?: () => Promise<unknown> | unknown
  loading?: boolean
  error?: Error | null
  query?: string
  canLoadMore?: boolean
  sort?: ForumAPI.SortMethod
}>()

const { message } = useLocalized()
const previousVisitAt = beginForumVisit()
const lastVisitedDividerIndex = computed(() =>
  findLastVisitedDividerIndex(data, previousVisitAt, sort),
)

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

const previewTopic = ref<ForumAPI.Topic | null>(null)
const previewOpen = ref(false)
const previewFocusComment = ref(false)

function openPreview(topic: ForumAPI.Topic, focusComment: boolean) {
  previewTopic.value = topic
  previewFocusComment.value = focusComment
  previewOpen.value = true
}
</script>

<template>
  <div>
    <TransitionGroup
      v-if="data.length > 0"
      tag="ul"
      name="topic-list"
      class="topic-list"
    >
      <li
        v-for="(item, index) in data"
        :key="item.id"
      >
        <Divider
          v-if="index === lastVisitedDividerIndex"
          variant="center"
          class="last-visited-divider py-3"
        >
          {{ message.forum.lastVisited }}
        </Divider>
        <ForumTopic
          :topic="item"
          @preview="openPreview"
        />
        <Separator
          v-if="index < data.length - 1 && index + 1 !== lastVisitedDividerIndex"
          class="h-1px"
        />
      </li>
    </TransitionGroup>

    <ForumTopicListSkeletons v-else-if="loading" />

    <ForumTopicListEmpty
      v-else
      class="my-8"
      :error="error"
      :query="query"
      :refresh-data="refreshData"
    />

    <ForumTopicPreviewDialog
      v-model:open="previewOpen"
      :topic="previewTopic"
      :focus-comment="previewFocusComment"
    />
  </div>
</template>

<style scoped>
.last-visited-divider {
  color: var(--vp-c-text-3);
}

.topic-list {
  position: relative;
}

.topic-list-enter-active {
  transition:
    transform 210ms cubic-bezier(0.33, 1, 0.68, 1) 90ms,
    opacity 210ms cubic-bezier(0.33, 1, 0.68, 1) 90ms,
    filter 210ms cubic-bezier(0.33, 1, 0.68, 1) 90ms;
}

.topic-list-leave-active {
  position: absolute;
  width: 100%;
  z-index: 1;
  transition:
    opacity 150ms cubic-bezier(0.33, 1, 0.68, 1),
    filter 150ms cubic-bezier(0.33, 1, 0.68, 1);
}

.topic-list-enter-from {
  transform: translateY(8px);
  opacity: 0;
  filter: blur(4px);
}

.topic-list-leave-to {
  opacity: 0;
  filter: blur(3px);
}

.topic-list-move {
  transition: transform 420ms cubic-bezier(0.32, 0.72, 0, 1);
}

@media (prefers-reduced-motion: reduce) {
  .topic-list-enter-active,
  .topic-list-leave-active {
    transition: opacity 120ms ease;
  }

  .topic-list-move {
    transition: none;
  }

  .topic-list-enter-from,
  .topic-list-leave-to {
    transform: none;
    filter: none;
    opacity: 0;
  }
}
</style>
