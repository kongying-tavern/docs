import type { JSONContent } from '@tiptap/core'
import type ForumAPI from '~/forum/api/types'
import { computed, ref } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { uploadImg } from '~/apis/interknot.site/upload'
import { GiteeAPIError } from '~/forum/api/gitee'
import { useForumCommentMutations } from '~/forum/composables/data/useForumMutations'
import { useForumPersonalState } from '~/forum/composables/data/useForumPersonalState'
import { calculateThumbHashForFile } from '~/forum/composables/view/calculateThumbHashForFile'
import { useImageAttachmentQueue } from '~/forum/composables/view/useImageAttachmentQueue'
import useLogin from '~/forum/hooks/useLogin'
import { submitCommentTransaction } from '~/forum/services/commentTransaction'
import { createCommentFormSchema } from '~/forum/services/form/validation'
import { VALIDATION_LIMITS } from '~/forum/services/forumConfig'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'
import { OpsEvents, trackOp } from '~/services/telemetry'
import { showPageAlert } from '~/services/telemetry/pageAlert'
import { toast } from '~/services/telemetry/toast'
import { formatMessage } from '~/utils/formatMessage'
import { formatImageAttachmentError } from '../../utils/submitFormUi'

export function useCommentComposer(options: { repo: ForumAPI.Repo, topicId: string, topic?: ForumAPI.Topic }, onSubmitted: (comment: ForumAPI.Comment) => void) {
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
        postComment: body => forumMutations.createComment({ repo: options.repo, topicId: options.topicId, body }),
        onSuccess: (comment) => {
          onSubmitted(comment)
          trackOp(OpsEvents.commentSubmit)
          content.value = emptyDoc()
          plainText.value = ''
          queue.reset()
          if (options.topic) {
            personal.recordParticipation(options.topic).catch((error) => {
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

  return { userInfo, userAuth, content, plainText, loading, busy, queue, submit, addFiles, retryAttachment, maxTextLength: VALIDATION_LIMITS.CONTENT.MAX_LENGTH }
}
