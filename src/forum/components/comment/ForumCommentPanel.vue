<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useElementBounding, useElementSize, useEventListener, useIntersectionObserver, useMediaQuery, useMutationObserver, watchOnce } from '@vueuse/core'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useLocalized } from '@/hooks/useLocalized'
import { scrollTo } from '~/composables/scrollTo'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/forum/services/forumConfig'
import ForumEmptyIllustration from '../ui/ForumEmptyIllustration.vue'
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
  editorOpen?: boolean
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
const mobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
const modalVisible = ref(false)
useMutationObserver(() => typeof document === 'undefined' ? null : document.body, () => {
  modalVisible.value = !!document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], .mobile-comment-dialog[data-state="closed"]')
}, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state'] })
const mobileFixed = computed(() => mobile.value && props.presentation === 'page')
const inputObservationTarget = computed(() => props.presentation === 'page' && !mobile.value && props.comments.length >= 5 ? inputAnchor.value : null)
watch(inputObservationTarget, () => inputVisible.value = true)
useIntersectionObserver(inputObservationTarget, ([entry]) => inputVisible.value = !!entry?.isIntersecting)
const docked = computed(() => mobileFixed.value || (props.presentation === 'page' && !!inputObservationTarget.value && !inputVisible.value))
const dockedStyle = computed(() => !docked.value ? undefined : mobileFixed.value ? { left: '0', width: '100%' } : { left: `${left.value}px`, width: `${width.value}px` })

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
  <div v-if="!closed" ref="area" class="forum-comment-surface" :class="{ 'pb-24': presentation === 'page', 'mobile-comment-surface': mobile }">
    <p v-if="presentation !== 'inline'" id="reply" class="font-(size-5 --vp-font-family-subtitle) line-height-[21px]" :class="presentation === 'embedded' ? 'mb-3 mt-0' : 'mb-5.5 mt-4'">
      {{ message.forum.comment.commentCount }}
      <span class="font-size-3.5 color-[var(--vp-c-text-3)] vertical-text-top">{{ count }}</span>
    </p>
    <div ref="inputAnchor" :style="docked && !mobileFixed ? { minHeight: `${inputHeight}px` } : undefined">
      <Teleport to="body" :disabled="!mobileFixed">
        <div ref="inputSurface" :class="{ 'comment-input-docked': docked, 'comment-input-mobile': mobileFixed, 'comment-input-covered': mobileFixed && (editorOpen || modalVisible) }" :style="dockedStyle">
          <slot name="input" />
        </div>
      </Teleport>
    </div>
    <div class="comment-list" :class="[presentation === 'embedded' || mobileFixed ? 'mt-4' : 'mt-8', entryAnimation && 'slide-enter']">
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
      <Empty v-if="presentation !== 'inline' && !loading && !error && !canLoadMore && !targetMissing && comments.length === 0" class="forum-empty-state border-none !py-6" role="status">
        <EmptyHeader>
          <EmptyMedia>
            <ForumEmptyIllustration variant="comment" compact />
          </EmptyMedia>
          <EmptyTitle>{{ message.forum.comment.noComment }}</EmptyTitle>
        </EmptyHeader>
      </Empty>
      <ForumLoadState
        v-else-if="presentation !== 'inline'"
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
  </div>
</template>

<style scoped>
.comment-input-docked {
  position: fixed;
  bottom: 0;
  z-index: 2;
  padding-top: 2rem;
  padding-bottom: 1.5rem;
  background: var(--vp-c-bg);
}
.comment-input-mobile {
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
  padding-top: 8px;
  padding-bottom: max(8px, env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--vp-c-divider);
}
.comment-input-covered {
  visibility: hidden;
  pointer-events: none;
}
.mobile-comment-surface :deep(.topic-comment-item) {
  scroll-margin-bottom: 80px;
}
@media (prefers-reduced-motion: reduce) {
  .comment-input-mobile,
  .comment-input-mobile :deep(*) {
    transition: none !important;
  }
}
</style>
