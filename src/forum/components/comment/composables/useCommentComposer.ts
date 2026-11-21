import type { JSONContent } from '@tiptap/core'
import type ForumAPI from '@/src/forum/api/types.d.ts'
import { useEventListener } from '@vueuse/core'
import { computed, onScopeDispose, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { GiteeAPIError } from '@/src/forum/api/gitee/index.ts'
import { uploadImg } from '@/src/forum/api/interknot.site/upload.ts'
import { useForumCommentMutations } from '@/src/forum/composables/data/useForumMutations.ts'
import { useForumPersonalState } from '@/src/forum/composables/data/useForumPersonalState.ts'
import { calculateThumbHashForFile } from '@/src/forum/composables/view/calculateThumbHashForFile.ts'
import { useImageAttachmentQueue } from '@/src/forum/composables/view/useImageAttachmentQueue.ts'
import useLogin from '@/src/forum/hooks/useLogin.ts'
import { submitCommentTransaction } from '@/src/forum/services/commentTransaction.ts'
import { createCommentFormSchema } from '@/src/forum/services/form/validation.ts'
import { VALIDATION_LIMITS } from '@/src/forum/services/forumConfig.ts'
import { useUserAuthStore } from '@/src/forum/stores/auth/useUserAuth.ts'
import { useUserInfoStore } from '@/src/forum/stores/auth/useUserInfo.ts'
import { OpsEvents, trackOp } from '@/src/services/telemetry/index.ts'
import { showPageAlert } from '@/src/services/telemetry/pageAlert.ts'
import { toast } from '@/src/services/telemetry/toast.ts'
import { formatImageAttachmentError } from '../../utils/submitFormUi.ts'

export function useCommentComposer(options: { repo: ForumAPI.Repo, topicId: string, topic?: ForumAPI.Topic }, onSubmitted: (comment: ForumAPI.Comment) => void) {
  const userInfo = useUserInfoStore()
  const userAuth = useUserAuthStore()
  const { t } = useI18n({ useScope: 'global' })
  const content = ref<JSONContent>(emptyDoc())
  const plainText = ref('')
  const submitPending = ref(false)
  const submitError = ref('')

  const forumMutations = useForumCommentMutations()
  const personal = useForumPersonalState()
  const { logout, redirectAuth } = useLogin()

  const queue = useImageAttachmentQueue({
    upload: uploadImg,
    prepare: calculateThumbHashForFile,
  })
  onScopeDispose(queue.reset)
  const loading = computed(() => submitPending.value || forumMutations.creatingComment.value)
  const busy = computed(() => loading.value || queue.isBusy.value)
  // The composer owns drafts across desktop, mobile, and closed editor panels.
  useEventListener('beforeunload', (event) => {
    if (plainText.value.trim() || queue.attachments.value.length || busy.value) {
      event.preventDefault()
      event.returnValue = ''
    }
  })
  function emptyDoc(): JSONContent {
    return { type: 'doc', content: [{ type: 'paragraph' }] }
  }

  function validateComment(text: string): Error | undefined {
    const result = createCommentFormSchema(t).safeParse({ content: text })
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
    submitError.value = ''
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
              toast.warning(t('forum.sidebar.syncFailed'), {
                error,
                ...(error instanceof GiteeAPIError && error.state === 403
                  ? {
                      action: {
                        label: t('forum.auth.login'),
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
          submitError.value = t('forum.publish.feedbackForm.uploadFailed')
          for (const error of result.errors)
            toast.error(formatImageAttachmentError(error, t), { report: false })
        }
        else {
          submitError.value = result.error.message
          showPageAlert(t('forum.comment.commentFail'), {
            id: 'comment-submit',
            scene: 'cm',
            error: result.error,
            descriptionFallback: result.error.message,
            description: t('forum.errors.traceIdWithMessage', {
              message: result.error.message,
              traceId: '{traceId}',
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
        toast.error(formatImageAttachmentError(error, t), { report: false })
    }
  }

  async function retryAttachment(id: string): Promise<void> {
    const result = await queue.retry(id)
    if (!result.ok) {
      for (const error of result.errors)
        toast.error(formatImageAttachmentError(error, t), { report: false })
    }
  }

  return { userInfo, userAuth, content, plainText, loading, busy, queue, submitError, submit, addFiles, retryAttachment, maxTextLength: VALIDATION_LIMITS.CONTENT.MAX_LENGTH }
}
