import type { JSONContent } from '@tiptap/core'
import type ForumAPI from '@/apis/forum/api'
import type { ImageAttachmentError, UploadImageAttachmentsResult } from '~/services/forum/form/imageAttachment'
import { encodeCommentBody } from '~/services/forum/forumContentCodec'

type CommentTransactionResult
  = | { ok: true, comment: ForumAPI.Comment }
    | { ok: false, stage: 'upload', errors: ImageAttachmentError[] }
    | { ok: false, stage: 'validation' | 'comment', error: Error }

export async function submitCommentTransaction(options: {
  content: string | JSONContent
  plainText: string
  validate: (plainText: string) => Error | undefined
  settleUploads: () => Promise<UploadImageAttachmentsResult>
  getUploadedAttachments: () => ForumAPI.ImageInfo[]
  postComment: (body: string) => Promise<ForumAPI.Comment>
  onSuccess?: (comment: ForumAPI.Comment) => void
}): Promise<CommentTransactionResult> {
  const validationError = options.validate(options.plainText)
  if (validationError)
    return { ok: false, stage: 'validation', error: validationError }

  const uploadResult = await options.settleUploads()
  if (!uploadResult.ok) {
    return {
      ok: false,
      stage: 'upload',
      errors: uploadResult.errors,
    }
  }

  try {
    const comment = await options.postComment(
      encodeCommentBody(options.content, options.getUploadedAttachments()),
    )
    options.onSuccess?.(comment)
    return { ok: true, comment }
  }
  catch (error) {
    return {
      ok: false,
      stage: 'comment',
      error: error instanceof Error ? error : new Error('Comment submission failed.'),
    }
  }
}
