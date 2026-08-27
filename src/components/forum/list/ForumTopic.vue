<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useRouter } from 'vitepress'
import { computed } from 'vue'
import { useForumViewMode } from '~/composables/useForumViewMode'
import ForumCommentArea from '../comment/ForumCommentArea.vue'
import ForumTopicComment from '../comment/ForumTopicComment.vue'
import { useTopicInteraction } from '../composables/useTopicInteraction'
import { useTopicState } from '../composables/useTopicState'
import ForumTopicContent from '../topic/ForumTopicContent.vue'
import ForumTopicHeader from '../topic/ForumTopicHeader.vue'
import ForumTopicMedia from '../topic/ForumTopicMedia.vue'
import ForumTopicTranslator from '../topic/ForumTopicTranslator.vue'
import ForumTagList from '../ui/ForumTagList.vue'
import ForumTopicFooter from './ForumTopicFooter.vue'

const { topic } = defineProps<{
  topic: ForumAPI.Topic | ForumAPI.Post
  comment?: ForumAPI.Comment
}>()

const emit = defineEmits<{
  preview: [topic: ForumAPI.Topic, focusComment: boolean]
}>()

const router = useRouter()

const { translator, menu: baseMenu, showComment } = useTopicState(topic)
const { isCardMode, isCompactMode } = useForumViewMode()

const menu = computed(() => {
  return isCardMode.value
    ? baseMenu.value
    : baseMenu.value.filter(item => !('id' in item && item.id === 'translator'))
})

const {
  inReply,
  detailHref,
} = useTopicInteraction(topic)

function handleSummaryClick() {
  router.go(detailHref())
}

function handleCommentClick() {
  emit('preview', topic, true)
}

function handleRowClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.closest('a, button, img, input, .forum-topic-summary'))
    return
  if (topic.type === 'POST')
    return
  emit('preview', topic, false)
}
</script>

<template>
  <div
    :id="`topic-${topic.id}`"
    class="forum-topic-item my-1 px-4 py-2 rounded-xl w-full hover:bg-[var(--vp-c-default-soft)]"
    :class="[topic.type]"
    @click="handleRowClick"
  >
    <div class="topic-content">
      <ForumTopicHeader
        :topic="topic"
        :menu="menu"
      />

      <div :class="isCompactMode ? 'flex w-full justify-between items-start flex-nowrap' : 'block'">
        <div :class="isCompactMode ? 'max-w-[calc(100%-100px)] overflow-hidden flex-1 min-w-0' : ''">
          <ForumTopicContent
            :topic="topic"
            :detail-href="detailHref()"
            @summary-click="handleSummaryClick"
          />

          <ForumTopicTranslator
            v-if="isCardMode"
            :key="`translator-${topic.id}`"
            ref="translator"
            :content="topic.content.text"
            :source-language="topic.language"
          />
        </div>

        <ForumTopicMedia
          v-if="isCompactMode"
          class="shrink-0 w-100px"
          :topic="topic"
        />
      </div>

      <ForumTopicMedia
        v-if="isCardMode"
        :topic="topic"
      />
    </div>

    <ForumTagList
      v-if="isCardMode"
      class="mt-2"
      :data="topic.tags"
    />

    <ForumTopicFooter
      v-if="topic.type !== 'POST'"
      :class="{ 'mt-4': isCardMode, 'mt-2': isCompactMode }"
      :topic-data="topic"
      @comment:click="handleCommentClick"
    />

    <div
      v-if="showComment && topic.relatedComments?.length && !isCompactMode && !inReply"
      class="topic-comment"
    >
      <ForumTopicComment
        v-for="(commentItem, index) in topic.relatedComments"
        :key="commentItem.id"
        v-motion-slide-top
        class="bg---vp-c-bg-soft px-4 first:mt-4"
        :class="{ 'rounded-b-none': inReply && index > 0, 'rounded-t-none': index > 0 }"
        repo="Feedback"
        size="small"
        :comment-count="-1"
        :comment-data="commentItem"
        :topic-author-id="topic.user.id"
        :topic-id="topic.id"
        @comment:click="handleCommentClick"
      />
    </div>

    <ForumCommentArea
      v-if="inReply && !isCompactMode"
      class="mt-4"
      :inline="true"
      repo="Feedback"
      :topic-id="topic.id!"
      :topic="topic.type === 'POST' ? undefined : topic"
      :topic-author-id="topic.user.id"
      :comment-count="topic.commentCount"
    />
  </div>
</template>

<style lang="scss" scoped>
.forum-topic-item:not(.ANN):hover .topic-title-link {
  text-decoration: underline;
}
</style>
