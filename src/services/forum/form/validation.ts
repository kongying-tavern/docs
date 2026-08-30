import type { Ref } from 'vue'
import type { CustomConfig } from '../../../../.vitepress/locales/types'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { VALIDATION_LIMITS } from '../forumConfig'

interface TopicValidationMessages {
  announcementPermission: string
  contentRequired: string
  tagsRequired: string
  titleRequired: string
  tooLong: (maximum: number) => string
  tooManyTags: (maximum: number) => string
}

const DEFAULT_TOPIC_VALIDATION_MESSAGES: TopicValidationMessages = {
  announcementPermission: 'You do not have permission to publish announcements.',
  contentRequired: `Content must contain at least ${VALIDATION_LIMITS.CONTENT.MIN_LENGTH} characters.`,
  tagsRequired: `Select at least ${VALIDATION_LIMITS.TAGS.MIN_COUNT} tag.`,
  titleRequired: 'Title is required.',
  tooLong: maximum => `Must contain at most ${maximum} characters.`,
  tooManyTags: maximum => `Select at most ${maximum} tags.`,
}

export function createTopicDraftSchema(options: {
  canPublishAnnouncement: boolean
  messages?: Partial<TopicValidationMessages>
}) {
  const messages = { ...DEFAULT_TOPIC_VALIDATION_MESSAGES, ...options.messages }

  return z.object({
    title: z.preprocess(
      value => value ?? '',
      z.string().max(VALIDATION_LIMITS.TITLE.MAX_LENGTH, messages.tooLong(VALIDATION_LIMITS.TITLE.MAX_LENGTH)),
    ),
    text: z.preprocess(
      value => value ?? '',
      z.string().max(VALIDATION_LIMITS.CONTENT.MAX_LENGTH, messages.tooLong(VALIDATION_LIMITS.CONTENT.MAX_LENGTH)),
    ),
    tags: z.preprocess(
      value => value ?? [],
      z.array(z.string().max(VALIDATION_LIMITS.TAGS.MAX_TAG_LENGTH))
        .max(VALIDATION_LIMITS.TAGS.MAX_COUNT, messages.tooManyTags(VALIDATION_LIMITS.TAGS.MAX_COUNT)),
    ),
    type: z.enum(['FEAT', 'BUG', 'ANN']),
  }).superRefine((draft, context) => {
    if (draft.text.trim().length < VALIDATION_LIMITS.CONTENT.MIN_LENGTH) {
      context.addIssue({
        code: 'custom',
        message: messages.contentRequired,
        path: ['text'],
      })
    }

    if (draft.type === 'BUG' && draft.tags.length < VALIDATION_LIMITS.TAGS.MIN_COUNT) {
      context.addIssue({
        code: 'custom',
        message: messages.tagsRequired,
        path: ['tags'],
      })
    }

    if ((draft.type === 'FEAT' || draft.type === 'ANN') && !draft.title.trim()) {
      context.addIssue({
        code: 'custom',
        message: messages.titleRequired,
        path: ['title'],
      })
    }

    if (draft.type === 'ANN' && !options.canPublishAnnouncement) {
      context.addIssue({
        code: 'custom',
        message: messages.announcementPermission,
        path: ['type'],
      })
    }
  })
}

export function createTopicFormSchema(
  message: Ref<CustomConfig>,
  canPublishAnnouncement: boolean,
) {
  const { forum } = message.value
  const { errors } = forum.validation

  return toTypedSchema(createTopicDraftSchema({
    canPublishAnnouncement,
    messages: {
      announcementPermission: errors.announcementPermission,
      contentRequired: errors.contentTooShort.replace('{min}', String(VALIDATION_LIMITS.CONTENT.MIN_LENGTH)),
      tagsRequired: errors.tagsRequired.replace('{min}', String(VALIDATION_LIMITS.TAGS.MIN_COUNT)),
      titleRequired: errors.titleRequired,
      tooLong: maximum => errors.contentTooLong.replace('{max}', String(maximum)),
      tooManyTags: maximum => errors.tooManyTagsLimit.replace('{max}', String(maximum)),
    },
  }))
}

export function createCommentFormSchema(message: Ref<CustomConfig>) {
  const { forum } = message.value
  const { errors } = forum.validation

  return z.object({
    content: z.string()
      .trim()
      .min(1, errors.commentEmpty)
      .max(VALIDATION_LIMITS.CONTENT.MAX_LENGTH, errors.contentTooLong.replace('{max}', String(VALIDATION_LIMITS.CONTENT.MAX_LENGTH))),
  })
}

export type TopicFormData = z.infer<ReturnType<typeof createTopicDraftSchema>>

export function getAllowedTopicTypes(canPublishAnnouncement: boolean): TopicFormData['type'][] {
  return canPublishAnnouncement ? ['BUG', 'FEAT', 'ANN'] : ['BUG', 'FEAT']
}
export type CommentFormData = z.infer<ReturnType<typeof createCommentFormSchema>>
