import type { ImageAttachmentError, UploadImageAttachmentsResult } from './imageAttachment.ts'
import type { TopicFormData } from './validation.ts'
import type ForumAPI from '@/src/forum/api/types.d.ts'
import { formatAttachmentMarkdownList } from '@/src/forum/services/forumContentCodec.ts'
import { createTopicDraftSchema } from './validation.ts'

export type TopicFormTransactionResult
  = | { ok: true, topic: ForumAPI.Topic }
    | { ok: false, stage: 'upload', errors: ImageAttachmentError[] }
    | { ok: false, stage: 'validation' | 'topic', error: Error }

export type TopicFormTransactionStage = 'uploading' | 'publishing'

export async function submitTopicFormTransaction(options: {
  draft: TopicFormData
  canPublishAnnouncement: boolean
  settleUploads: () => Promise<UploadImageAttachmentsResult>
  getUploadedAttachments: () => ForumAPI.ImageInfo[]
  submitTopic: (draft: ForumAPI.CreateTopicOption) => Promise<ForumAPI.Topic>
  onStage?: (stage: TopicFormTransactionStage) => void
  onSuccess?: (topic: ForumAPI.Topic) => void
}): Promise<TopicFormTransactionResult> {
  const parsed = createTopicDraftSchema({
    canPublishAnnouncement: options.canPublishAnnouncement,
  }).safeParse(options.draft)
  if (!parsed.success) {
    return {
      ok: false,
      stage: 'validation',
      error: new Error(parsed.error.issues[0]?.message || 'Topic validation failed.'),
    }
  }

  options.onStage?.('uploading')
  const uploadResult = await options.settleUploads()
  if (!uploadResult.ok) {
    return {
      ok: false,
      stage: 'upload',
      errors: uploadResult.errors,
    }
  }

  const draft: ForumAPI.CreateTopicOption = {
    type: parsed.data.type,
    isPrivate: parsed.data.isPrivate === true,
    title: parsed.data.title.trim(),
    text: parsed.data.text.trim()
      + formatAttachmentMarkdownList(options.getUploadedAttachments()),
    tags: parsed.data.type === 'ANN' ? [] : [...parsed.data.tags],
    ...(parsed.data.quotedTopic ? { quotedTopic: parsed.data.quotedTopic } : {}),
  }

  try {
    options.onStage?.('publishing')
    const topic = await options.submitTopic(draft)
    options.onSuccess?.(topic)
    return { ok: true, topic }
  }
  catch (error) {
    return {
      ok: false,
      stage: 'topic',
      error: error instanceof Error ? error : new Error('Topic submission failed.'),
    }
  }
}
