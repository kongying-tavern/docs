<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type ForumAPI from '~/forum/api/types'
import { useLocalized } from '@/hooks/useLocalized'
import { useCommentComposer } from './composables/useCommentComposer'
import ForumCommentComposer from './ForumCommentComposer.vue'

const props = withDefaults(defineProps<{
  topicId: string
  placeholder?: string[] | string
  replyTarget?: string
  collapse?: boolean
  repo?: ForumAPI.Repo
  class?: HTMLAttributes['class']
  topic?: ForumAPI.Topic
  autofocus?: boolean
  entryAnimation?: boolean
}>(), { placeholder: () => [''], replyTarget: '', collapse: true, repo: 'Feedback', autofocus: false, entryAnimation: true })
const emit = defineEmits<{ 'comment:submit': [comment: ForumAPI.Comment] }>()
const { message } = useLocalized()
const { userInfo, userAuth, content, plainText, loading, busy, queue, submit, addFiles, retryAttachment, maxTextLength } = useCommentComposer(props, comment => emit('comment:submit', comment))
function login(): void {
  location.hash = 'login-alert'
}
</script>

<template>
  <ForumCommentComposer
    v-model="content"
    :class="props.class"
    :avatar="userInfo.info?.avatar"
    :username="userInfo.info?.username"
    :authenticated="userAuth.isTokenValid"
    :loading="loading"
    :busy="busy"
    :attachments="queue.attachments.value"
    :collapse="collapse"
    :max-text-length="maxTextLength"
    :autofocus="autofocus"
    :entry-animation="entryAnimation"
    :placeholders="placeholder"
    :reply-target="replyTarget"
    :label="message.forum.comment.comment"
    @input="plainText = $event"
    @files-selected="addFiles"
    @remove-attachment="queue.remove"
    @retry-attachment="retryAttachment"
    @submit="submit"
    @login="login"
  />
</template>
