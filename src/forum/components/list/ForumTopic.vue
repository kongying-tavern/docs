<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { computed, ref } from 'vue'
import { useForumViewMode } from '~/forum/composables/state/useForumViewMode'
import ForumCommentArea from '../comment/ForumCommentArea.vue'
import { useTopicInteraction } from '../composables/useTopicInteraction'
import { useTopicState } from '../composables/useTopicState'
import ForumQuotedTopic from '../topic/ForumQuotedTopic.vue'
import ForumTopicContent from '../topic/ForumTopicContent.vue'
import ForumTopicHeader from '../topic/ForumTopicHeader.vue'
import ForumTopicMedia from '../topic/ForumTopicMedia.vue'
import ForumTopicTranslator from '../topic/ForumTopicTranslator.vue'
import ForumTagList from '../ui/ForumTagList.vue'
import ForumTopicCard from './ForumTopicCard.vue'
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

function handleCommentClick(destination: 'detail' | 'preview') {
  if (destination === 'detail') {
    toPostDetailPage('reply')
    return
  }
  emit('preview', topic, true)
}

function handleRowActivation(destination: 'detail' | 'preview'): void {
  if (topic.type === 'POST')
    return
  if (destination === 'detail') {
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
  <ForumTopicCard
    :topic="topic" :compact="isCompactMode" :card-mode="isCardMode" :show-comment="showComment" :in-reply="inReply"
    @prepare="prepareTopicDetail" @activate="handleRowActivation" @comment="handleCommentClick"
  >
    <template #header>
      <ForumTopicHeader :topic="topic" :menu="menu" />
    </template>
    <template #content>
      <ForumTopicContent :topic="topic" :detail-href="detailHref()" :content-override="showingTranslation ? translatedContent : undefined" :title-override="showingTranslation ? translatedTitle : undefined" @summary-click="handleSummaryClick">
        <template #translation>
          <ForumTopicTranslator :key="`translator-${topic.id}`" ref="translator" :content="topic.content.text" :title="topic.title" :source-language="topic.language" @translated="showTranslatedContent" @title-translated="translatedTitle = $event" @close="showingTranslation = false" />
        </template>
      </ForumTopicContent>
    </template>
    <template #media>
      <ForumTopicMedia :topic="topic" />
    </template>
    <template #tags>
      <ForumTagList :data="topic.tags" />
    </template>
    <template v-if="topic.type !== 'POST' && topic.quotedTopic" #quote>
      <ForumQuotedTopic :reference="topic.quotedTopic" :compact="isCompactMode" />
    </template>
    <template v-if="topic.type !== 'POST'" #footer="{ openComments }">
      <ForumTopicItemFooter :topic-data="topic" @comment:click="openComments" />
    </template>
    <template #comments>
      <ForumCommentArea inline repo="Feedback" :topic-id="topic.id" :topic="topic.type === 'POST' ? undefined : topic" :topic-author-id="topic.user.id" :comment-count="topic.commentCount" />
    </template>
  </ForumTopicCard>
</template>
