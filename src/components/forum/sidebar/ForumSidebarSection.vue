<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useLocalized } from '@/hooks/useLocalized'
import ForumTopicDropdownMenu from '../topic/ForumTopicDropdownMenu.vue'
import ForumTopicTypeBadge from '../ui/ForumTopicTypeBadge.vue'

withDefaults(defineProps<{
  title: string
  icon: string
  items?: Array<{
    id: string
    title: string
    href: string
    type: ForumAPI.TopicType
    commentCount?: number
    newCommentCount?: number
    state?: ForumAPI.TopicState
    canUnfollow?: boolean
    menuTopic?: ForumAPI.Topic
  }>
  open: boolean
  loginPrompt?: string
  loginAction?: string
  actionDisabled?: boolean
}>(), {
  items: () => [],
  loginPrompt: '',
  loginAction: '',
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  'unfollow': [topicId: string]
}>()

const { message } = useLocalized()

function handleToggle(event: Event) {
  emit('update:open', (event.currentTarget as HTMLDetailsElement).open)
}

function commentLabel(item: { commentCount?: number, newCommentCount?: number }): string {
  const newCount = item.newCommentCount ?? 0
  const template = newCount > 0
    ? message.value.forum.sidebar.newComments
    : message.value.forum.sidebar.totalComments
  return template.replace('{count}', String(newCount || item.commentCount || 0))
}

function badgeText(count: number): string {
  return count > 99 ? '99+' : String(count)
}
</script>

<template>
  <details class="forum-sidebar-section" :open="open" @toggle="handleToggle">
    <summary class="forum-sidebar-summary">
      <span :class="icon" aria-hidden="true" />
      <span class="flex-1 min-w-0 truncate">{{ title }}</span>
      <span class="chevron i-lucide-chevron-down" aria-hidden="true" />
    </summary>

    <div class="mt-1">
      <slot />
      <template v-if="items.length > 0">
        <div class="forum-sidebar-topic-list">
          <div
            v-for="item in items"
            :key="item.id"
            class="forum-sidebar-topic-row"
          >
            <a :href="item.href" class="forum-sidebar-topic" :title="item.title">
              <ForumTopicTypeBadge :type="item.type" icon-only class="forum-sidebar-topic-type" />
              <span class="flex-1 min-w-0 truncate">{{ item.title }}</span>
              <span
                v-if="(item.commentCount ?? 0) > 0"
                class="forum-sidebar-comments"
                :class="{ closed: item.state === 'closed' }"
                role="img"
                :aria-label="commentLabel(item)"
              >
                <span
                  class="size-4"
                  :class="item.state === 'closed' ? 'i-lucide-message-circle-check' : 'i-lucide-message-circle'"
                  aria-hidden="true"
                />
                <span
                  v-if="(item.newCommentCount ?? 0) > 0"
                  class="forum-sidebar-comment-badge"
                  aria-hidden="true"
                >
                  {{ badgeText(item.newCommentCount ?? 0) }}
                </span>
                <span v-else class="forum-sidebar-comment-count" aria-hidden="true">
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
  max-height: 240px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.forum-sidebar-topic-list::-webkit-scrollbar {
  width: 5px;
}

.forum-sidebar-topic-list::-webkit-scrollbar-track {
  background: transparent;
}

.forum-sidebar-topic-list::-webkit-scrollbar-thumb {
  background: transparent;
}

.forum-sidebar-topic-list:hover {
  scrollbar-color: var(--vp-c-divider) transparent;
}

.forum-sidebar-topic-list:hover::-webkit-scrollbar-thumb {
  border-radius: 99px;
  background: var(--vp-c-divider);
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
  padding: 8px 10px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  list-style: none;
}

.forum-sidebar-summary::-webkit-details-marker {
  display: none;
}

.forum-sidebar-summary:hover,
.forum-sidebar-topic-row:hover,
.forum-sidebar-topic-row:focus-within {
  background: var(--vp-c-default-soft);
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
  font-size: 13px;
  line-height: 20px;
}

.forum-sidebar-topic-type {
  flex-shrink: 0;
}

.forum-sidebar-comments {
  position: relative;
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
  font-size: 11px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
}

.forum-sidebar-comment-badge {
  position: absolute;
  top: -2px;
  right: -3px;
  display: inline-flex;
  min-width: 15px;
  height: 15px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0 3px;
  background: var(--vp-c-danger-1);
  color: var(--vp-c-white);
  font-size: 9px;
  font-weight: 700;
  line-height: 15px;
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
  outline: 2px solid var(--vp-c-brand-1);
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
  font-size: 13px;
  line-height: 20px;
}

@media (prefers-reduced-motion: reduce) {
  .chevron {
    transition: none;
  }
}
</style>
