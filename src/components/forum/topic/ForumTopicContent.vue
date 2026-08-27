<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { data as forumDocumentLinks } from '~/_data/forumDocumentLinks.data'
import { useForumRoute } from '~/composables/useForumRoute'
import { renderForumTopicSummary } from '~/services/forum/forumContentRenderer'
import ForumTopicTypeBadge from '../ui/ForumTopicTypeBadge.vue'
import { useTopicContent } from './composables/useTopicContent'

const { topic, detailHref } = defineProps<{
  topic: ForumAPI.Topic | ForumAPI.Post
  detailHref: string
}>()

const emit = defineEmits<{
  'expand:click': []
  'summary-click': []
}>()

const { message } = useLocalized()
const { topicHref } = useForumRoute()

/**
 * 正文整体作为跳转入口：由父级决定是跳详情页还是打开预览；正文渲染出的内部 <a>/<button> 正常放行。
 */
function handleSummaryClick(event: MouseEvent | KeyboardEvent) {
  const target = event.target as HTMLElement
  if (target.closest('a, button'))
    return
  if (event instanceof MouseEvent && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey))
    return
  event.preventDefault()
  emit('summary-click')
}

const {
  isPost,
  isAnn,
  isCardMode,
  isCompactMode,
  isExpanded,
  hasOverflow,
  toggleExpand,
  shouldShowTitle,
  displayTitle,
  displayContent,
} = useTopicContent(topic)

const renderedContent = computed(() => renderForumTopicSummary(displayContent.value, {
  topicHref: id => topicHref(id, null),
  documentLinks: forumDocumentLinks,
}))

function handleExpandClick(): void {
  toggleExpand()
  emit('expand:click')
}
</script>

<template>
  <div class="topic-content">
    <div class="content-main mt-1">
      <h4
        v-if="shouldShowTitle"
        class="mt-2 flex break-words line-clamp-2"
        :class="{
          'font-size-4.5 font-[--vp-font-family-title]': isCardMode,
          'font-size-3.5 font-[--vp-font-family-subtitle]': isCompactMode,
        }"
      >
        <a v-if="!isAnn" class="topic-title-link color-inherit no-underline line-clamp-2" :href="detailHref">
          {{ displayTitle }}
        </a>
        <p v-else class="line-clamp-2">
          {{ displayTitle }}
        </p>
      </h4>

      <ForumTopicTypeBadge v-if="isCardMode" :type="topic.type" />

      <article
        v-if="isCardMode"
        class="font-size-3.5 mt-1 pr-4 opacity-99 whitespace-pre-wrap transition-all duration-300 overflow-hidden"
      >
        <div
          v-if="!isPost && !isAnn"
          class="forum-topic-summary color-inherit block cursor-pointer"
          :class="{ 'line-clamp-4': !isExpanded }"
          role="link"
          tabindex="0"
          @click="handleSummaryClick($event)"
          @keydown.enter="handleSummaryClick($event)"
          v-html="renderedContent"
        />

        <div
          v-else-if="isAnn"
          class="forum-topic-summary"
          :class="{ 'line-clamp-4': !isExpanded }"
          v-html="renderedContent"
        />

        <div v-else class="forum-topic-summary" v-html="renderedContent" />
        <a
          v-if="isPost"
          class="font-size-4 vp-link py-2 inline-flex"
          :href="detailHref"
        >
          {{ message.forum.readMore }}
        </a>

        <button
          v-else-if="!isAnn && hasOverflow && !isExpanded"
          type="button"
          class="font-size-4 vp-link px-0 py-2 border-0 bg-transparent"
          @click="handleExpandClick"
        >
          {{ message.forum.topic.showMore }}
        </button>
      </article>

      <div
        v-if="isCompactMode"
        class="font-size-3.5 mt-1 opacity-99 whitespace-pre-wrap overflow-hidden"
      >
        <div
          v-if="!isPost && !isAnn"
          class="forum-topic-summary color-inherit block cursor-pointer line-clamp-2"
          role="link"
          tabindex="0"
          @click="handleSummaryClick($event)"
          @keydown.enter="handleSummaryClick($event)"
          v-html="renderedContent"
        />

        <div v-else-if="isAnn" class="forum-topic-summary line-clamp-2" v-html="renderedContent" />

        <div v-else class="forum-topic-summary" v-html="renderedContent" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-main {
  transition: all 0.2s ease;
}

.topic-title-link:hover {
  color: inherit;
  text-decoration: underline;
}
</style>
