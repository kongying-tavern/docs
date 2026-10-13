<script setup lang="ts">
import type { TopicTranslationSnapshot } from '../topic/ForumTopicTranslator.vue'
import type ForumAPI from '~/forum/api/types'
import { useMediaQuery } from '@vueuse/core'
import { computed, nextTick, onActivated, onDeactivated, ref, useTemplateRef, watch } from 'vue'
import Divider from '@/components/ui/divider/Divider.vue'
import { FluidHoverList } from '@/components/ui/fluid-hover'
import Separator from '@/components/ui/separator/Separator.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumViewMode } from '~/forum/composables/state/useForumViewMode'
import { useForumListPrefetch } from '~/forum/composables/view/useForumListPrefetch'
import { provideForumTopicPresentation } from '~/forum/composables/view/useForumTopicPresentation'
import { useForumTopicWindow } from '~/forum/composables/view/useForumTopicWindow'
import { useIdlePreload } from '~/forum/composables/view/useIdlePreload'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/forum/services/forumConfig'
import { beginForumVisit, findLastVisitedDividerIndex } from '~/forum/services/forumLastVisit'
import ForumTopicPreviewDialog from '../topic/ForumTopicPreviewDialog.vue'
import { preloadForumTopicPreviewContent } from '../utils/forumComponentPreload'
import ForumTopic from './ForumTopic.vue'
import ForumTopicEntry from './ForumTopicEntry.vue'
import ForumTopicListEmpty from './ForumTopicListEmpty.vue'
import ForumTopicListSkeletons from './ForumTopicListSkeletons.vue'
import ForumTopicScrollPreview from './ForumTopicScrollPreview.vue'

const props = defineProps<{
  data: ForumAPI.Topic[]
  loadMore?: () => Promise<unknown> | unknown
  refreshData?: () => Promise<unknown> | unknown
  loading?: boolean
  pageLoadDuration?: number
  error?: Error | null
  query?: string
  canLoadMore?: boolean
  sort?: ForumAPI.SortMethod
}>()

const active = ref(true)
const { isCompactMode } = useForumViewMode()
provideForumTopicPresentation(() => props.data)
const listHost = useTemplateRef<HTMLElement>('listHost')
const { rows, windowed, height, setRoot, measureRow } = useForumTopicWindow(() => props.data, active)
onActivated(() => active.value = true)
const hasRenderedTopics = ref(props.data.length > 0)
const leavingRows = ref(0)
watch(() => props.data.length, (length) => {
  if (length > 0)
    hasRenderedTopics.value = true
})

const enterDelays = ref(new Map<string, number>())
const translations = new Map<string, TopicTranslationSnapshot>()
function saveTranslation(id: string, snapshot: TopicTranslationSnapshot | undefined): void {
  if (snapshot)
    translations.set(id, snapshot)
  else
    translations.delete(id)
}
watch(() => props.data.map(topic => topic.id), (ids, previousIds) => {
  const current = new Set(ids)
  for (const id of translations.keys()) {
    if (!current.has(id))
      translations.delete(id)
  }
  const delays = new Map<string, number>()
  const previous = previousIds ?? []
  const appended = previous.length > 0 && ids.length > previous.length && previous.every((id, index) => ids[index] === id)
  if (appended) {
    for (const [index, id] of ids.slice(previous.length).entries())
      delays.set(id, Math.min(index, 5) * 80)
  }
  enterDelays.value = delays
  // Only rows mounted by this append commit can animate; later window remounts cannot.
  void nextTick(() => enterDelays.value.clear())
}, { immediate: true })

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

useForumListPrefetch({
  get itemCount() { return props.data.length },
  get loadMore() { return props.loadMore },
  get loading() { return props.loading },
  get error() { return props.error },
  get canLoadMore() { return props.canLoadMore },
  get pageLoadDuration() { return props.pageLoadDuration },
}, listHost, active)

const previewTopic = ref<ForumAPI.Topic | null>(null)
const previewOpen = ref(false)
const previewFocusComment = ref(false)
onDeactivated(() => {
  active.value = false
  previewOpen.value = false
})

function openPreview(topic: ForumAPI.Topic, focusComment: boolean) {
  previewTopic.value = topic
  previewFocusComment.value = focusComment
  previewOpen.value = true
}
</script>

<template>
  <div ref="listHost">
    <FluidHoverList
      v-if="hasRenderedTopics"
      :indicator-class="windowed ? 'rounded-xl bg-[var(--vp-c-default-soft)] z-1' : 'rounded-xl bg-[var(--vp-c-default-soft)]'"
    >
      <TransitionGroup
        :ref="setRoot"
        tag="ul"
        :name="windowed ? '' : 'topic-list'"
        :css="!windowed"
        class="topic-list"
        :style="height === undefined ? undefined : { height: `${height}px` }"
        :data-total-items="data.length"
        :data-windowed="windowed"
        @before-leave="leavingRows++"
        @after-leave="leavingRows--"
        @leave-cancelled="leavingRows--"
      >
        <li
          v-for="{ item, index, start, size, preview } in rows"
          :ref="measureRow"
          :key="item.id"
          :data-topic-id="item.id"
          :data-index="index"
          :aria-posinset="index + 1"
          :aria-setsize="data.length"
          :style="start === undefined ? undefined : { position: 'absolute', top: `${start}px`, left: 0, width: '100%', height: preview ? `${size}px` : undefined }"
        >
          <Divider
            v-if="index === lastVisitedDividerIndex"
            variant="center"
            class="last-visited-divider py-3"
          >
            {{ message.forum.lastVisited }}
          </Divider>
          <ForumTopicEntry :delay="enterDelays.get(item.id)" @entered="enterDelays.delete(item.id)">
            <ForumTopicScrollPreview v-if="preview" :topic="item" :height="size!" :compact="isCompactMode && item.type !== 'ANN'" />
            <ForumTopic
              v-else
              :topic="item"
              :translation-snapshot="translations.get(item.id)"
              @prepare-preview="preparePreview"
              @preview="openPreview"
              @translation-snapshot="saveTranslation(item.id, $event)"
            />
          </ForumTopicEntry>
          <Separator
            v-if="index < data.length - 1 && index + 1 !== lastVisitedDividerIndex"
            class="h-1px"
          />
        </li>
      </TransitionGroup>
    </FluidHoverList>

    <ForumTopicListSkeletons v-if="data.length === 0 && leavingRows === 0 && loading" />

    <ForumTopicListEmpty
      v-else-if="data.length === 0 && leavingRows === 0"
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

/* A single viewport-sized paint layer remains available while the compositor
   scrolls ahead of the main thread. Rich rows cover it once their window lands. */
.topic-list[data-windowed='true']::before {
  content: '';
  display: block;
  position: sticky;
  top: calc(var(--vp-nav-height) + 8px);
  height: calc(100dvh - var(--vp-nav-height) - 8px);
  pointer-events: none;
  will-change: transform;
  background-image:
    linear-gradient(transparent 20px, var(--vp-c-default-soft) 20px 38px, transparent 38px),
    linear-gradient(transparent 54px, var(--vp-c-default-soft) 54px 66px, transparent 66px),
    linear-gradient(transparent 78px, var(--vp-c-default-soft) 78px 90px, transparent 90px);
  background-size:
    42% 180px,
    88% 180px,
    72% 180px;
  background-position: 16px 0;
  background-repeat: repeat-y;
}

.topic-list[data-windowed='true'] > li {
  background: var(--vp-c-bg);
}

.topic-list[data-windowed='true'] :deep(.topic-entry-boundary) {
  position: relative;
  z-index: 2;
}

.topic-list-leave-active {
  position: absolute;
  width: 100%;
  z-index: 1;
  transition: opacity 150ms cubic-bezier(0.33, 1, 0.68, 1);
}

.topic-list-leave-to {
  opacity: 0;
}

.topic-list-move {
  transition: transform 420ms cubic-bezier(0.32, 0.72, 0, 1);
}

html[data-reduced-motion='true'] .topic-list-leave-active {
  transition: opacity 120ms ease;
}

html[data-reduced-motion='true'] .topic-list-move {
  transition: none;
}

html[data-reduced-motion='true'] .topic-list-leave-to {
  transform: none;
  filter: none;
  opacity: 0;
}
</style>
