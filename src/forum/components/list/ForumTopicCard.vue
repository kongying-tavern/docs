<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useMediaQuery } from '@vueuse/core'
import { computed } from 'vue'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/forum/services/forumConfig'
import ForumCommentItem from '../comment/ForumCommentItem.vue'

const { topic, compact, cardMode, showComment, inReply } = defineProps<{
  topic: ForumAPI.Topic | ForumAPI.Post
  compact: boolean
  cardMode: boolean
  showComment: boolean
  inReply: boolean
}>()
const emit = defineEmits<{ activate: [destination: 'detail' | 'preview'], prepare: [destination: 'detail' | 'preview'], comment: [destination: 'detail' | 'preview'] }>()
const isMobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
function prepare(): void {
  if (topic.type !== 'POST')
    emit('prepare', isMobile.value ? 'detail' : 'preview')
}
function openComments(): void {
  emit('comment', isMobile.value ? 'detail' : 'preview')
}
function openTopic(): void {
  if (topic.type !== 'POST')
    emit('activate', isMobile.value ? 'detail' : 'preview')
}
const { reducedMotion } = useSitePreferences()
const commentEntryMotion = computed(() => reducedMotion.value ? {} : { initial: { y: -24, opacity: 0 }, enter: { y: 0, opacity: 1 } })
function activate(event: MouseEvent): void {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
    return
  const target = event.target as Element | null
  if (target?.closest('a, button, img, input, textarea, [contenteditable], [data-forum-card-interactive]'))
    return
  if (topic.type !== 'POST')
    openTopic()
}
</script>

<template>
  <div
    :id="`topic-${topic.id}`" :data-forum-topic="String(topic.id)"
    class="forum-topic-item my-1 px-4 py-2 rounded-xl w-full hover:bg-[var(--vp-c-default-soft)]"
    :class="[topic.type]" :tabindex="topic.type === 'POST' ? undefined : 0"
    @pointerenter="prepare" @focusin="prepare" @pointerdown="prepare" @keydown.enter.self="prepare(); openTopic()" @click="activate"
  >
    <div class="topic-content">
      <div data-forum-card-interactive>
        <slot name="header" />
      </div>
      <div :class="compact ? 'flex w-full justify-between items-start flex-nowrap' : 'block'">
        <div :class="compact ? 'max-w-[calc(100%-100px)] overflow-hidden flex-1 min-w-0' : ''">
          <slot name="content" />
        </div>
        <div v-if="compact" class="shrink-0 w-100px" data-forum-card-interactive>
          <slot name="media" />
        </div>
      </div>
      <div v-if="cardMode" data-forum-card-interactive>
        <slot name="media" />
      </div>
    </div>
    <div v-if="cardMode" class="mt-2" data-forum-card-interactive>
      <slot name="tags" />
    </div>
    <div v-if="$slots.quote" class="mt-2" data-forum-card-interactive>
      <slot name="quote" />
    </div>
    <div v-if="topic.type !== 'POST'" :class="{ 'mt-4': cardMode, 'mt-2': compact }" data-forum-card-interactive>
      <slot name="footer" :open-comments="openComments" />
    </div>
    <div v-if="showComment && topic.relatedComments?.length && !compact && !inReply" class="topic-comment mt-4 px-4 py-2 rounded-md bg-[var(--vp-c-bg-soft)]" data-forum-card-interactive>
      <ForumCommentItem
        v-for="commentItem in topic.relatedComments" :key="commentItem.id" v-motion
        :initial="commentEntryMotion.initial" :enter="commentEntryMotion.enter" repo="Feedback" size="small"
        :comment-count="-1" :comment-data="commentItem" :topic-author-id="topic.user.id" :topic-id="topic.id"
        @comment:click="openComments"
      />
    </div>
    <div v-if="inReply && !compact" class="mt-4" data-forum-card-interactive>
      <slot name="comments" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.forum-topic-item:not(.ANN):hover :deep(.topic-title-link) {
  text-decoration: underline;
}
</style>
