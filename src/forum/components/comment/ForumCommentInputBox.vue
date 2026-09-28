<script setup lang="ts">
import type { JSONContent } from '@tiptap/core'
import type { HTMLAttributes } from 'vue'
import type ForumAPI from '~/forum/api/types'
import { computed, ref } from 'vue'
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { calculateThumbHashForFile } from '@/composables/calculateThumbHashForFile'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { uploadImg } from '~/apis/interknot.site/upload'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { GiteeAPIError } from '~/forum/api/gitee'
import { useForumCommentMutations } from '~/forum/composables/useForumMutations'
import { useForumPersonalState } from '~/forum/composables/useForumPersonalState'
import { useImageAttachmentQueue } from '~/forum/composables/useImageAttachmentQueue'
import useLogin from '~/forum/hooks/useLogin'
import { submitCommentTransaction } from '~/forum/services/commentTransaction'
import { VALIDATION_LIMITS } from '~/forum/services/config'
import { createCommentFormSchema } from '~/forum/services/form/validation'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'
import { OpsEvents, trackOp } from '~/services/telemetry'
import { showPageAlert } from '~/services/telemetry/pageAlert'
import { toast } from '~/services/telemetry/toast'
import { formatMessage } from '~/utils/formatMessage'
import ForumRichTextarea from '../form/ForumRichTextarea.vue'
import { formatImageAttachmentError } from '../utils/submitFormUi'

const {
  topicId,
  replyTarget = '',
  placeholder = [''],
  repo = 'Feedback',
  collapse = true,
  topic,
  autofocus = false,
  entryAnimation = true,
} = defineProps<{
  topicId: string
  placeholder?: string[] | string
  replyTarget?: string
  collapse?: boolean
  repo?: ForumAPI.Repo
  class?: HTMLAttributes['class']
  topic?: ForumAPI.Topic
  autofocus?: boolean
  entryAnimation?: boolean
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

const forumMutations = useForumCommentMutations()
const personal = useForumPersonalState()
const { logout, redirectAuth } = useLogin()

const queue = useImageAttachmentQueue({
  upload: uploadImg,
  prepare: calculateThumbHashForFile,
})
const loading = computed(() => submitPending.value || forumMutations.creatingComment.value)
const busy = computed(() => loading.value || queue.isBusy.value)
const { reducedMotion } = useSitePreferences()
const entryMotion = computed(() => (entryAnimation && !reducedMotion.value
  ? { initial: { y: -24, opacity: 0 }, enter: { y: 0, opacity: 1 } }
  : {}))

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
        trackOp(OpsEvents.commentSubmit)
        content.value = emptyDoc()
        plainText.value = ''
        queue.reset()
        if (topic) {
          personal.recordParticipation(topic).catch((error) => {
            toast.warning(message.value.forum.sidebar.syncFailed, {
              error,
              ...(error instanceof GiteeAPIError && error.state === 403
                ? {
                    action: {
                      label: message.value.forum.auth.login,
                      onClick: () => {
                        logout()
                        redirectAuth()
                      },
                    },
                  }
                : {}),
            })
          })
        }
      },
    })

    if (!result.ok) {
      if (result.stage === 'upload') {
        for (const error of result.errors)
          toast.error(formatImageAttachmentError(error, message.value.forum.publish.feedbackForm), { report: false })
      }
      else {
        showPageAlert(message.value.forum.comment.commentFail, {
          id: 'comment-submit',
          scene: 'cm',
          error: result.error,
          description: formatMessage(message.value.forum.errors.traceIdWithMessage, {
            message: result.error.message,
          }),
        })
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
      toast.error(formatImageAttachmentError(error, message.value.forum.publish.feedbackForm), { report: false })
  }
}

async function retryAttachment(id: string): Promise<void> {
  const result = await queue.retry(id)
  if (!result.ok) {
    for (const error of result.errors)
      toast.error(formatImageAttachmentError(error, message.value.forum.publish.feedbackForm), { report: false })
  }
}
</script>

<template>
  <div
    v-motion
    :initial="entryMotion.initial"
    :enter="entryMotion.enter"
    class="flex"
    :class="cn('flex', $props.class)"
  >
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
      :loading="busy"
      :collapse="collapse"
      :max-text-length="VALIDATION_LIMITS.CONTENT.MAX_LENGTH"
      :autofocus="autofocus"
      :entry-animation="entryAnimation"
      :placeholders="placeholder"
      :reply-target="replyTarget"
      :aria-label="message.forum.comment.comment"
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
