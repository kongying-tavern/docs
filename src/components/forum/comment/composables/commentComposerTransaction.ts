import type { JSONContent } from '@tiptap/core'
import type ForumAPI from '@/apis/forum/api'
import { encodeCommentBody } from '~/services/forum/forumContentCodec'

export type CommentTransactionResult
  = | { ok: true, comment: ForumAPI.Comment }
    | { ok: false, stage: 'validation' | 'upload' | 'comment', error: Error }

export async function submitCommentTransaction(options: {
  content: string | JSONContent
  plainText: string
  validate: (plainText: string) => Error | undefined
  uploadPending: () => Promise<{ ok: true } | { ok: false, errors: Array<{ message: string }> }>
  getUploadedAttachments: () => ForumAPI.ImageInfo[]
  postComment: (body: string) => Promise<ForumAPI.Comment>
  onSuccess?: (comment: ForumAPI.Comment) => void
}): Promise<CommentTransactionResult> {
  const validationError = options.validate(options.plainText)
  if (validationError)
    return { ok: false, stage: 'validation', error: validationError }

  const uploadResult = await options.uploadPending()
  if (!uploadResult.ok) {
    return {
      ok: false,
      stage: 'upload',
      error: new Error(uploadResult.errors[0]?.message || 'Image upload failed.'),
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
