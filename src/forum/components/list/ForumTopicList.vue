<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useEventListener, useMediaQuery } from '@vueuse/core'
import { computed, ref } from 'vue'
import Divider from '@/components/ui/divider/Divider.vue'
import { FluidHoverList } from '@/components/ui/fluid-hover'
import Separator from '@/components/ui/separator/Separator.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useIdlePreload } from '~/forum/composables/view/useIdlePreload'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/forum/services/forumConfig'
import { beginForumVisit, findLastVisitedDividerIndex } from '~/forum/services/forumLastVisit'
import ForumTopicPreviewDialog from '../topic/ForumTopicPreviewDialog.vue'
import { preloadForumTopicPreviewContent } from '../utils/forumComponentPreload'
import ForumTopic from './ForumTopic.vue'
import ForumTopicListEmpty from './ForumTopicListEmpty.vue'
import ForumTopicListSkeletons from './ForumTopicListSkeletons.vue'

const props = defineProps<{
  data: ForumAPI.Topic[]
  loadMore?: () => Promise<unknown> | unknown
  refreshData?: () => Promise<unknown> | unknown
  loading?: boolean
  error?: Error | null
  query?: string
  canLoadMore?: boolean
  sort?: ForumAPI.SortMethod
}>()

function preparePreview(): void {
  void preloadForumTopicPreviewContent().catch(() => {})
}

const mobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
useIdlePreload(preloadForumTopicPreviewContent, () => props.data.length > 0 && !mobile.value)
useIdlePreload(() => import('../topic/ForumTopicPage.vue'), () => props.data.length > 0 && mobile.value)

const { message } = useLocalized()
const previousVisitAt = beginForumVisit()
const lastVisitedDividerIndex = computed(() =>
  findLastVisitedDividerIndex(props.data, previousVisitAt, props.sort ?? 'created'),
)

if (props.loadMore) {
  // vueuse 的 useInfiniteScroll 对 window 目标不可用（IntersectionObserver 无法
  // 观察 window -> isElementVisible 恒 false -> 自动加载从不触发），这里自实现：
  // 监听 window scroll，滚动距文档底部小于阈值时加载下一页，loading/error 时跳过。
  let autoLoading = false
  useEventListener(
    window,
    'scroll',
    () => {
      const scrollRoot = document.documentElement
      if (autoLoading || props.loading || props.error || !props.canLoadMore)
        return
      if (scrollRoot.scrollHeight - scrollRoot.scrollTop - scrollRoot.clientHeight < 64) {
        autoLoading = true
        Promise.resolve(props.loadMore!()).finally(() => {
          autoLoading = false
        })
      }
    },
    { passive: true },
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
    <FluidHoverList
      v-if="props.data.length > 0"
      indicator-class="rounded-xl bg-[var(--vp-c-default-soft)]"
    >
      <TransitionGroup
        tag="ul"
        name="topic-list"
        class="topic-list"
      >
        <li
          v-for="(item, index) in props.data"
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
            @prepare-preview="preparePreview"
            @preview="openPreview"
          />
          <Separator
            v-if="index < data.length - 1 && index + 1 !== lastVisitedDividerIndex"
            class="h-1px"
          />
        </li>
      </TransitionGroup>
    </FluidHoverList>

    <ForumTopicListSkeletons v-else-if="loading" />

    <ForumTopicListEmpty
      v-else
      class="my-8"
      :error="props.error"
      :query="props.query"
      :refresh-data="props.refreshData"
    />

    <ForumTopicPreviewDialog
      v-if="previewTopic"
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

html[data-reduced-motion='true'] .topic-list-enter-active,
html[data-reduced-motion='true'] .topic-list-leave-active {
  transition: opacity 120ms ease;
}

html[data-reduced-motion='true'] .topic-list-move {
  transition: none;
}

html[data-reduced-motion='true'] .topic-list-enter-from,
html[data-reduced-motion='true'] .topic-list-leave-to {
  transform: none;
  filter: none;
  opacity: 0;
}
</style>
