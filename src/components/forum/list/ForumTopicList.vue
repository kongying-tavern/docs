<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useInfiniteScroll } from '@vueuse/core'
import { computed, ref } from 'vue'
import Divider from '@/components/ui/divider/Divider.vue'
import Separator from '@/components/ui/separator/Separator.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { beginForumVisit, findLastVisitedDividerIndex } from '~/services/forum/forumLastVisit'
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
      name="fade"
    >
      <li
        v-for="(item, index) in data"
        :key="item.id"
        :style="{ '--i': Math.min(index, 5) }"
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

.fade-enter-active {
  transition:
    transform 720ms cubic-bezier(0.23, 1, 0.32, 1),
    opacity 720ms cubic-bezier(0.23, 1, 0.32, 1);
  transition-delay: calc(var(--i) * 56ms);
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
  transition: transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1);
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .fade-move {
    transition: none;
  }
}
</style>
