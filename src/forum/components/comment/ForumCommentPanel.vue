<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useElementBounding, useElementSize, useEventListener, useIntersectionObserver, watchOnce } from '@vueuse/core'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import Separator from '@/components/ui/separator/Separator.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { scrollTo } from '~/composables/scrollTo'
import ForumLoadState from '../ui/ForumLoadState.vue'
import ForumCommentItem from './ForumCommentItem.vue'

const props = withDefaults(defineProps<{
  presentation: 'page' | 'embedded' | 'inline'
  comments: ForumAPI.Comment[]
  replyId?: string | number | null
  commentPages: Map<string, number>
  repo: ForumAPI.Repo
  topicId: string
  topicAuthorId: string | number
  count: number
  closed: boolean
  loading: boolean
  error: boolean
  rateLimit: boolean
  errorMessage: string
  canLoadMore: boolean
  loadMessage: string
  initialPage: boolean
  targetId: string | null
  targetReady: boolean
  targetMissing: boolean
  detailHref: string
  entryAnimation?: boolean
}>(), { entryAnimation: true })
const emit = defineEmits<{
  'load-more': []
  'retry': []
  'login': []
  'reply': [id: string | number]
}>()
const { message } = useLocalized()
const area = useTemplateRef('area')
const inputAnchor = useTemplateRef('inputAnchor')
const inputSurface = useTemplateRef('inputSurface')
const { left, width } = useElementBounding(area)
const { height: inputHeight } = useElementSize(inputSurface)
const inputVisible = ref(true)
const inputObservationTarget = computed(() => props.presentation === 'page' && props.comments.length >= 5 ? inputAnchor.value : null)
watch(inputObservationTarget, () => inputVisible.value = true)
useIntersectionObserver(inputObservationTarget, ([entry]) => inputVisible.value = !!entry?.isIntersecting)
const docked = computed(() => props.presentation === 'page' && !!inputObservationTarget.value && !inputVisible.value)

if (!import.meta.env.SSR) {
  useEventListener(window, 'scroll', () => {
    if (props.presentation !== 'page' || props.closed || props.loading || props.error || !props.canLoadMore)
      return
    const root = document.documentElement
    if (root.scrollHeight - root.scrollTop - root.clientHeight < 64)
      emit('load-more')
  }, { passive: true })
}

watchOnce(() => props.loading, async () => {
  if (props.presentation !== 'page' || props.targetId)
    return
  await nextTick()
  scrollTo()
})

let lastScrolledCommentId: string | null = null
watch(() => [props.targetId, props.targetReady] as const, async ([commentId, ready]) => {
  if (!commentId) {
    lastScrolledCommentId = null
    return
  }
  if (!ready || commentId === lastScrolledCommentId)
    return
  await nextTick()
  const target = area.value?.querySelector<HTMLElement>(`[id="reply-${CSS.escape(commentId)}"]`)
  if (!target)
    return
  lastScrolledCommentId = commentId
  if (props.presentation === 'page')
    scrollTo({ el: target, hash: `#reply-${commentId}` })
  else
    target.scrollIntoView({ block: 'nearest' })
  target.focus({ preventScroll: true })
}, { immediate: true })
</script>

<template>
  <div v-if="!closed" ref="area" :class="{ 'pb-24': presentation === 'page' }">
    <p v-if="presentation !== 'inline'" id="reply" class="font-(size-5 --vp-font-family-subtitle) line-height-[21px] mb-5.5 mt-4">
      {{ message.forum.comment.commentCount }}
      <span class="font-size-3.5 color-[var(--vp-c-text-3)] vertical-text-top">{{ count }}</span>
    </p>
    <div ref="inputAnchor" :style="docked ? { minHeight: `${inputHeight}px` } : undefined">
      <div ref="inputSurface" :class="{ 'comment-input-docked': docked }" :style="docked ? { left: `${left}px`, width: `${width}px` } : undefined">
        <slot name="input" />
      </div>
    </div>
    <div class="comment-list mt-8" :class="entryAnimation && 'slide-enter'">
      <ForumCommentItem
        v-for="(comment, index) in comments"
        :id="`reply-${comment.id}`"
        :key="comment.id"
        tabindex="-1"
        :class="{ 'last-comment': index === comments.length - 1 }"
        :repo="repo"
        :topic-author-id="topicAuthorId"
        :topic-id="topicId"
        :comment-data="comment"
        :comment-page="commentPages.get(String(comment.id)) ?? 1"
        :comment-click-handler="() => emit('reply', comment.id)"
      >
        <div v-if="String(replyId) === String(comment.id)" class="mt-4">
          <slot name="reply" :comment="comment" />
        </div>
      </ForumCommentItem>
      <ForumLoadState
        v-if="presentation !== 'inline'"
        :loading="loading"
        :error="error"
        :rate-limit="rateLimit"
        :error-message="errorMessage"
        :can-load-more="canLoadMore"
        :load-more="() => emit('load-more')"
        :retry="() => emit('retry')"
        :text="loadMessage"
        :loading-text="message.forum.comment.loadingComment"
        :status="targetMissing ? 'alert' : 'status'"
        @login="emit('login')"
      />
      <a v-if="canLoadMore && presentation === 'inline'" class="font-size-3 c-[var(--vp-c-text-3)] vp-link text-center w-full cursor-pointer" :href="detailHref">
        {{ message.forum.comment.loadMoreComment }}
      </a>
    </div>
    <Separator v-if="initialPage && loading && presentation !== 'inline'" class="font-size-3 c-[var(--vp-c-text-3)] my-8 text-center w-full inline-block" :label="message.forum.comment.loadingComment" />
  </div>
</template>

<style scoped>
.comment-input-docked {
  position: fixed;
  bottom: 0;
  z-index: 2;
  padding-top: 2rem;
  padding-bottom: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}
</style>
