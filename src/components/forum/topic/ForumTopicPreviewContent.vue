<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { useForumRoute } from '~/composables/useForumRoute'
import ForumCommentArea from '../comment/ForumCommentArea.vue'
import ForumTopicFooter from '../list/ForumTopicFooter.vue'
import ForumTopicContent from './ForumTopicContent.vue'
import ForumTopicHeader from './ForumTopicHeader.vue'
import ForumTopicMedia from './ForumTopicMedia.vue'

const props = defineProps<{
  topic: ForumAPI.Topic
  /** 打开时自动聚焦评论输入框 */
  focusComment?: boolean
}>()

const { topicHref } = useForumRoute()

const detailHref = computed(() => topicHref(String(props.topic.id), null))
</script>

<template>
  <div class="flex flex-col gap-4">
    <ForumTopicHeader :topic="topic" />
    <ForumTopicContent :topic="topic" :detail-href="detailHref" />
    <ForumTopicMedia :topic="topic" />
    <ForumTopicFooter :topic-data="topic" hide-comment-button />
    <ForumCommentArea
      repo="Feedback"
      :topic-id="String(topic.id)"
      :topic-author-id="topic.user.id"
      :comment-count="topic.commentCount"
      :topic="topic"
      :autofocus-input="focusComment"
    />
  </div>
</template>
