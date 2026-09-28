<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useMediaQuery } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useForumViewMode } from '~/composables/useForumViewMode'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/services/forum/forumConfig'
import ForumCommentArea from '../comment/ForumCommentArea.vue'
import ForumTopicComment from '../comment/ForumTopicComment.vue'
import { useTopicInteraction } from '../composables/useTopicInteraction'
import { useTopicState } from '../composables/useTopicState'
import ForumQuotedTopic from '../topic/ForumQuotedTopic.vue'
import ForumTopicContent from '../topic/ForumTopicContent.vue'
import ForumTopicHeader from '../topic/ForumTopicHeader.vue'
import ForumTopicMedia from '../topic/ForumTopicMedia.vue'
import ForumTopicTranslator from '../topic/ForumTopicTranslator.vue'
import ForumTagList from '../ui/ForumTagList.vue'
import ForumTopicItemFooter from './ForumTopicItemFooter.vue'

const { topic } = defineProps<{
  topic: ForumAPI.Topic | ForumAPI.Post
  comment?: ForumAPI.Comment
}>()

const emit = defineEmits<{
  preview: [topic: ForumAPI.Topic, focusComment: boolean]
}>()

const { translator, menu: baseMenu, showComment } = useTopicState(topic)
const { isCardMode, isCompactMode } = useForumViewMode(() => topic.type)
const isMobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
const { reducedMotion } = useSitePreferences()
// 与 ForumCommentInputBox 的 entryMotion 同款守卫：reduced-motion 下不位移
const commentEntryMotion = computed(() => (reducedMotion.value
  ? {}
  : { initial: { y: -24, opacity: 0 }, enter: { y: 0, opacity: 1 } }))
const translatedContent = ref<string>()
const translatedTitle = ref('')
const showingTranslation = ref(false)

const menu = computed(() => {
  return isCardMode.value
    ? baseMenu.value
    : baseMenu.value.filter(item => !('id' in item && item.id === 'translator'))
})

const {
  inReply,
  detailHref,
  prepareTopicDetail,
  toPostDetailPage,
} = useTopicInteraction(topic)

function handleSummaryClick() {
  toPostDetailPage()
}

function handleCommentClick() {
  if (isMobile.value) {
    toPostDetailPage('reply')
    return
  }
  emit('preview', topic, true)
}

function handleRowClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.closest('a, button, img, input, .forum-topic-summary, [data-forum-shared-topic="author"], [data-forum-time]'))
    return
  if (topic.type === 'POST')
    return
  if (isMobile.value) {
    toPostDetailPage()
    return
  }
  emit('preview', topic, false)
}

function showTranslatedContent(content: string): void {
  translatedContent.value = content
  showingTranslation.value = true
}
</script>

<template>
  <div
    :id="`topic-${topic.id}`"
    :data-forum-topic="String(topic.id)"
    class="forum-topic-item my-1 px-4 py-2 rounded-xl w-full hover:bg-[var(--vp-c-default-soft)]"
    :class="[topic.type]"
    @pointerdown="prepareTopicDetail"
    @keydown.enter="prepareTopicDetail"
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
            :content-override="showingTranslation ? translatedContent : undefined"
            :title-override="showingTranslation ? translatedTitle : undefined"
            @summary-click="handleSummaryClick"
          >
            <template #translation>
              <ForumTopicTranslator
                :key="`translator-${topic.id}`"
                ref="translator"
                :content="topic.content.text"
                :title="topic.title"
                :source-language="topic.language"
                @translated="showTranslatedContent"
                @title-translated="translatedTitle = $event"
                @close="showingTranslation = false"
              />
            </template>
          </ForumTopicContent>
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

    <ForumQuotedTopic
      v-if="topic.type !== 'POST' && topic.quotedTopic"
      class="mt-2"
      :reference="topic.quotedTopic"
      :compact="isCompactMode"
    />

    <ForumTopicItemFooter
      v-if="topic.type !== 'POST'"
      :class="{ 'mt-4': isCardMode, 'mt-2': isCompactMode }"
      :topic-data="topic"
      @comment:click="handleCommentClick"
    />

    <div
      v-if="showComment && topic.relatedComments?.length && !isCompactMode && !inReply"
      class="topic-comment mt-4 px-4 py-2 rounded-md bg-[var(--vp-c-bg-soft)]"
    >
      <ForumTopicComment
        v-for="commentItem in topic.relatedComments"
        :key="commentItem.id"
        v-motion
        :initial="commentEntryMotion.initial"
        :enter="commentEntryMotion.enter"
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
      :topic-id="topic.id"
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
