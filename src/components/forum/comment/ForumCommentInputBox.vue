<script setup lang="ts">
import type { JSONContent } from '@tiptap/core'
import type { HTMLAttributes } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { uploadImg } from '@/apis/interknot.site/upload'
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { calculateThumbHashForFile } from '@/composables/calculateThumbHashForFile'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useForumMutations } from '~/composables/forum/useForumMutations'
import { useForumPersonalState } from '~/composables/forum/useForumPersonalState'
import { useImageAttachmentQueue } from '~/composables/useImageAttachmentQueue'
import { submitCommentTransaction } from '~/services/forum/commentTransaction'
import { createCommentFormSchema } from '~/services/forum/form/validation'
import { VALIDATION_LIMITS } from '~/services/forum/forumConfig'
import ForumRichTextarea from '../form/ForumRichTextarea.vue'
import { formatImageAttachmentError } from '../utils/forumUi'

const {
  topicId,
  replyTarget = '',
  placeholder = [''],
  repo = 'Feedback',
  collapse = true,
  topic,
  autofocus = false,
} = defineProps<{
  topicId: string
  placeholder?: string[] | string
  replyTarget?: string
  collapse?: boolean
  repo?: ForumAPI.Repo
  class?: HTMLAttributes['class']
  topic?: ForumAPI.Topic
  autofocus?: boolean
}>()

const emit = defineEmits<{
  'comment:submit': [comment: ForumAPI.Comment]
}>()

const userInfo = useUserInfoStore()
const userAuth = useUserAuthStore()
const { message } = useLocalized()
const content = ref<JSONContent>(emptyDoc())
const plainText = ref('')
const submitPending = ref(false)

const forumMutations = useForumMutations()
const personal = useForumPersonalState()

const queue = useImageAttachmentQueue({
  upload: uploadImg,
  prepare: calculateThumbHashForFile,
})
const loading = computed(() => submitPending.value || forumMutations.creatingComment.value || queue.isBusy.value)

function emptyDoc(): JSONContent {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

function validateComment(text: string): Error | undefined {
  const result = createCommentFormSchema(message).safeParse({ content: text })
  return result.success ? undefined : new Error(result.error.issues[0]?.message || 'Invalid comment.')
}

async function submit(): Promise<void> {
  if (submitPending.value)
    return
  if (!userAuth.isTokenValid) {
    location.hash = 'login-alert'
    return
  }

  submitPending.value = true
  try {
    const result = await submitCommentTransaction({
      content: content.value,
      plainText: plainText.value,
      validate: validateComment,
      settleUploads: queue.settleUploads,
      getUploadedAttachments: () => queue.serializedAttachments.value,
      postComment: body => forumMutations.createComment({ repo, topicId, body }),
      onSuccess: (comment) => {
        emit('comment:submit', comment)
        content.value = emptyDoc()
        plainText.value = ''
        queue.reset()
        if (topic) {
          personal.recordParticipation(topic).catch(() => {
            toast.warning(message.value.forum.sidebar.syncFailed)
          })
        }
      },
    })

    if (!result.ok) {
      if (result.stage === 'upload') {
        for (const error of result.errors)
          toast.error(formatImageAttachmentError(error, message.value.forum.publish.feedbackForm))
      }
      else {
        toast.error(`${message.value.forum.comment.commentFail}${result.error.message}`)
      }
    }
  }
  finally {
    submitPending.value = false
  }
}

async function addFiles(files: File[]): Promise<void> {
  const result = await queue.addFiles(files)
  if (!result.ok) {
    for (const error of result.errors)
      toast.error(formatImageAttachmentError(error, message.value.forum.publish.feedbackForm))
  }
}

async function retryAttachment(id: string): Promise<void> {
  const result = await queue.retry(id)
  if (!result.ok) {
    for (const error of result.errors)
      toast.error(formatImageAttachmentError(error, message.value.forum.publish.feedbackForm))
  }
}
</script>

<template>
  <div v-motion-slide-top class="flex" :class="cn('flex', $props.class)">
    <div class="user-avatar mr-2 flex w-[64px]">
      <UserAvatar
        size="lg"
        :src="userInfo.info?.avatar"
        :alt="userInfo.info?.username"
      />
    </div>

    <ForumRichTextarea
      v-if="userAuth.isTokenValid"
      v-model="content"
      container-class="w-[calc(100%-72px)]"
      :attachments="queue.attachments.value"
      :disabled="loading"
      :loading="loading"
      :collapse="collapse"
      :max-text-length="VALIDATION_LIMITS.CONTENT.MAX_LENGTH"
      :autofocus="autofocus"
      :placeholders="placeholder"
      :reply-target="replyTarget"
      @input="plainText = $event"
      @files-selected="addFiles"
      @remove-attachment="queue.remove"
      @retry-attachment="retryAttachment"
      @submit="submit"
    />
    <div
      v-else
      class="font-size-3.5 line-height-[32px] ml-4 p-2 text-center rounded-md bg-[var(--vp-c-bg-soft)] h-auto min-h-48px w-[calc(100%-80px)] cursor-text"
    >
      <DynamicTextReplacer
        :data="message.forum.comment.commentAfterLogin"
        class="important:line-height-[32px] important:m-0"
      >
        <template #login>
          <a class="vp-link" href="#login-alert">
            [{{ message.forum.auth.login }}]
          </a>
        </template>
      </DynamicTextReplacer>
    </div>
  </div>
</template>
