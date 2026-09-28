<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { computed } from 'vue'
import { useForumRoute } from '~/forum/composables/useForumRoute'
import ForumCommentArea from '../comment/ForumCommentArea.vue'
import ForumTopicItemFooter from '../list/ForumTopicItemFooter.vue'
import ForumQuotedTopic from './ForumQuotedTopic.vue'
import ForumTopicContent from './ForumTopicContent.vue'
import ForumTopicHeader from './ForumTopicHeader.vue'
import ForumTopicMedia from './ForumTopicMedia.vue'

const props = defineProps<{
  topic: ForumAPI.Topic
  /** 打开时自动聚焦评论输入框 */
  focusComment?: boolean
}>()

const emit = defineEmits<{
  'detail-click': []
}>()

const { topicHref } = useForumRoute()

const detailHref = computed(() => topicHref(String(props.topic.id), null))
</script>

<template>
  <div class="flex flex-col gap-4">
    <ForumTopicHeader :topic="topic" />
    <ForumTopicContent
      :topic="topic"
      :detail-href="detailHref"
      @summary-click="emit('detail-click')"
    />
    <ForumTopicMedia :topic="topic" />
    <ForumQuotedTopic
      v-if="topic.quotedTopic"
      :reference="topic.quotedTopic"
    />
    <ForumTopicItemFooter :topic-data="topic" hide-comment-button />
    <ForumCommentArea
      repo="Feedback"
      :topic-id="String(topic.id)"
      :topic-author-id="topic.user.id"
      :comment-count="topic.commentCount"
      :topic="topic"
      :autofocus-input="focusComment"
      :entry-animation="false"
    />
  </div>
</template>
