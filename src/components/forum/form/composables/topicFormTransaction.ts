import type { TopicFormData } from '../../utils/validation'
import type ForumAPI from '@/apis/forum/api'
import { formatAttachmentMarkdownList } from '~/services/forum/forumContentCodec'
import { createTopicDraftSchema } from '../../utils/validation'

export type TopicFormTransactionResult
  = | { ok: true, topic: ForumAPI.Topic }
    | { ok: false, stage: 'validation' | 'upload' | 'topic', error: Error }

export async function submitTopicFormTransaction(options: {
  draft: TopicFormData
  canPublishAnnouncement: boolean
  uploadPending: () => Promise<{ ok: true } | { ok: false, errors: Array<{ message: string }> }>
  getUploadedAttachments: () => ForumAPI.ImageInfo[]
  submitTopic: (draft: ForumAPI.CreateTopicOption) => Promise<ForumAPI.Topic>
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

  const uploadResult = await options.uploadPending()
  if (!uploadResult.ok) {
    return {
      ok: false,
      stage: 'upload',
      error: new Error(uploadResult.errors[0]?.message || 'Image upload failed.'),
    }
  }

  const draft: ForumAPI.CreateTopicOption = {
    ...parsed.data,
    title: parsed.data.title.trim(),
    text: parsed.data.text.trim()
      + formatAttachmentMarkdownList(options.getUploadedAttachments()),
    tags: parsed.data.type === 'ANN' ? [] : [...parsed.data.tags],
  }

  try {
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
