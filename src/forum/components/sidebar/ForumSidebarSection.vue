<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useResizeObserver } from '@vueuse/core'
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import ForumTopicDropdownMenu from '../topic/ForumTopicDropdownMenu.vue'
import ForumTopicMetadata from '../ui/ForumTopicMetadata.vue'

const { items = [], loginPrompt = '', loginAction = '' } = defineProps<{
  title: string
  icon: string
  items?: Array<{
    id: string
    title: string
    href: string
    type: ForumAPI.TopicType
    state?: ForumAPI.TopicState
    status?: ForumAPI.TopicStatus
    goodIssue?: boolean
    commentCount?: number
    closedUnseen?: boolean
    canUnfollow?: boolean
    menuTopic?: ForumAPI.Topic
    draft?: boolean
  }>
  open: boolean
  loginPrompt?: string
  loginAction?: string
  actionDisabled?: boolean
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'unfollow': [topicId: string]
  'openDraft': []
}>()

const { message } = useLocalized()

const topicListEl = useTemplateRef<HTMLElement>('topicListEl')
const topicListScrollable = ref(false)

// 内容不满一屏时滚动遮罩会误淡出最后一行,只在真正可滚动时启用
function measureTopicList() {
  const el = topicListEl.value
  topicListScrollable.value = el ? el.scrollHeight > el.clientHeight + 1 : false
}

watch(() => items.length, () => nextTick(measureTopicList))
useResizeObserver(topicListEl, measureTopicList)

function handleToggle(event: Event) {
  emit('update:open', (event.currentTarget as HTMLDetailsElement).open)
}

function commentLabel(item: { commentCount?: number }): string {
  return message.value.forum.sidebar.totalComments.replace('{count}', String(item.commentCount || 0))
}
</script>

<template>
  <details class="forum-sidebar-section" :open="open" @toggle="handleToggle">
    <summary
      data-fluid-hover-item
      class="forum-sidebar-summary"
    >
      <span :class="icon" aria-hidden="true" />
      <span class="flex-1 min-w-0 truncate">{{ title }}</span>
      <span class="chevron i-lucide-chevron-down" aria-hidden="true" />
    </summary>

    <div class="mt-1">
      <slot />
      <template v-if="items.length > 0">
        <div
          ref="topicListEl"
          class="forum-sidebar-topic-list"
          :class="{ 'scroll-fade': topicListScrollable }"
        >
          <div
            v-for="item in items"
            :key="item.id"
            data-fluid-hover-item
            class="forum-sidebar-topic-row"
          >
            <a :href="item.href" class="forum-sidebar-topic" :title="item.title" :data-draft-type="item.draft ? item.type : undefined" @click="item.draft && emit('openDraft')">
              <ForumTopicMetadata
                :type="item.type"
                :topic-id="item.id"
                :state="item.state"
                :status="item.status"
                :good-issue="item.goodIssue"
                icon-only
                class="forum-sidebar-topic-type"
              />
              <span class="flex-1 min-w-0 truncate">{{ item.title }}</span>
              <span v-if="item.draft" class="text-xs text-secondary-foreground px-2 py-0.5 rounded-full bg-secondary shrink-0">
                {{ message.forum.publish.feedbackForm.draftBadge }}
              </span>
              <span
                v-if="(item.commentCount ?? 0) > 0"
                class="forum-sidebar-comments"
                :class="{ closed: item.closedUnseen }"
                role="img"
                :aria-label="commentLabel(item)"
              >
                <span
                  class="size-4"
                  :class="item.closedUnseen ? 'i-lucide-message-circle-check' : 'i-lucide-message-circle'"
                  aria-hidden="true"
                />
                <span class="forum-sidebar-comment-count" aria-hidden="true">
                  {{ item.commentCount }}
                </span>
              </span>
            </a>
            <ForumTopicDropdownMenu
              v-if="item.menuTopic"
              :topic-data="item.menuTopic"
              side="right"
              class="p-0 size-7"
            />
            <button
              v-if="item.canUnfollow"
              type="button"
              class="forum-sidebar-unfollow"
              :disabled="actionDisabled"
              :aria-label="message.forum.labels.unfollow"
              :title="message.forum.labels.unfollow"
              @click="emit('unfollow', item.id)"
            >
              <span class="i-lucide-bookmark-minus size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </template>
      <div v-else-if="loginPrompt" class="forum-sidebar-login-prompt">
        <span>{{ loginPrompt }}</span>
        <a v-if="loginAction" class="vp-link" href="#login-alert">{{ loginAction }}</a>
      </div>
    </div>
  </details>
</template>

<style scoped>
.forum-sidebar-section {
  border-top: 1px solid var(--vp-c-divider);
  padding: 8px 0;
}

.forum-sidebar-topic-list {
  @apply panel-scrollbar;
  max-height: 240px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.forum-sidebar-summary,
.forum-sidebar-topic-row {
  border-radius: 8px;
  color: var(--vp-c-text-2);
}

.forum-sidebar-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  padding: 8px 10px;
  cursor: pointer;
  @apply text-ui-12;
  font-weight: 600;
  list-style: none;
}

.forum-sidebar-summary::-webkit-details-marker {
  display: none;
}

.forum-sidebar-summary:hover,
.forum-sidebar-topic-row:hover,
.forum-sidebar-topic-row:focus-within {
  color: var(--vp-c-text-1);
}

.chevron {
  transition: transform 160ms ease;
}

details[open] .chevron {
  transform: rotate(180deg);
}

.forum-sidebar-topic-row {
  display: flex;
  align-items: center;
  position: relative;
  min-height: 48px;
  padding: 5px 6px 5px 10px;
}

.forum-sidebar-topic {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
  color: inherit;
  @apply text-ui-13;
  @apply leading-ui-20;
}

.forum-sidebar-topic-type {
  flex-shrink: 0;
}

.forum-sidebar-comments {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  gap: 3px;
  flex-shrink: 0;
  border-radius: 6px;
  padding: 0 3px;
  color: var(--vp-c-text-3);
}

.forum-sidebar-comments.closed {
  color: var(--vp-c-success-1);
}

.forum-sidebar-comment-count {
  @apply text-ui-11;
  @apply leading-ui-16;
  font-variant-numeric: tabular-nums;
}

.forum-sidebar-unfollow {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  place-items: center;
  border-radius: 6px;
  color: var(--vp-c-text-3);
}

.forum-sidebar-unfollow:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-danger-1);
}

.forum-sidebar-unfollow:focus-visible {
  outline: 2px solid oklch(var(--ring));
  outline-offset: 1px;
}

.forum-sidebar-unfollow:disabled {
  cursor: wait;
  opacity: 0.5;
}

.forum-sidebar-login-prompt {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px 7px 36px;
  color: var(--vp-c-text-3);
  @apply text-ui-13;
  @apply leading-ui-20;
}

html[data-reduced-motion='true'] .chevron {
  transition: none;
}
</style>
