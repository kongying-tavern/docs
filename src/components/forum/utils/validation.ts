import type { Ref } from 'vue'
import type { CustomConfig } from '../../../../.vitepress/locales/types'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { VALIDATION_LIMITS } from '../constants'

export interface TopicValidationMessages {
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
    title: z.string().max(VALIDATION_LIMITS.TITLE.MAX_LENGTH, messages.tooLong(VALIDATION_LIMITS.TITLE.MAX_LENGTH)),
    text: z.string().max(VALIDATION_LIMITS.CONTENT.MAX_LENGTH, messages.tooLong(VALIDATION_LIMITS.CONTENT.MAX_LENGTH)),
    tags: z.array(z.string().max(VALIDATION_LIMITS.TAGS.MAX_TAG_LENGTH))
      .max(VALIDATION_LIMITS.TAGS.MAX_COUNT, messages.tooManyTags(VALIDATION_LIMITS.TAGS.MAX_COUNT)),
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

/**
 * 创建话题表单验证 Schema (VeeValidate 兼容)
 * 使用 toTypedSchema 包装以支持 VeeValidate
 */
export function createTopicFormSchema(
  message: Ref<CustomConfig>,
  canPublishAnnouncement: boolean,
) {
  const { forum } = message.value
  const { errors } = forum.validation

  return toTypedSchema(createTopicDraftSchema({
    canPublishAnnouncement,
    messages: {
      announcementPermission: '权限不足：只有管理员可以发布公告类型的内容',
      contentRequired: errors.contentTooShort.replace('{min}', String(VALIDATION_LIMITS.CONTENT.MIN_LENGTH)),
      tagsRequired: errors.tagsRequired.replace('{min}', String(VALIDATION_LIMITS.TAGS.MIN_COUNT)),
      titleRequired: errors.contentTooShort.replace('{min}', String(VALIDATION_LIMITS.TITLE.MIN_LENGTH)),
      tooLong: maximum => errors.contentTooLong.replace('{max}', String(maximum)),
      tooManyTags: maximum => errors.tooManyTagsLimit.replace('{max}', String(maximum)),
    },
  }))
}

/**
 * 创建评论表单验证 Schema
 */
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

/**
 * 创建图片上传验证 Schema
 */
export function createImageUploadSchema(message: Ref<CustomConfig>) {
  return z.object({
    file: z.instanceof(File)
      .refine(
        (file: File) => file.size <= VALIDATION_LIMITS.IMAGES.MAX_BYTES,
        `File size must not exceed ${VALIDATION_LIMITS.IMAGES.MAX_SIZE_LABEL}`,
      )
      .refine(
        (file: File) => VALIDATION_LIMITS.IMAGES.ALLOWED_TYPES.includes(file.type as (typeof VALIDATION_LIMITS.IMAGES.ALLOWED_TYPES)[number]),
        message.value.forum.validation.errors.invalidImageFormat,
      ),
  })
}

// 类型导出
export interface TopicFormData {
  title: string
  text: string
  tags: string[]
  type: 'FEAT' | 'BUG' | 'ANN'
}

export function getAllowedTopicTypes(canPublishAnnouncement: boolean): TopicFormData['type'][] {
  return canPublishAnnouncement ? ['BUG', 'FEAT', 'ANN'] : ['BUG', 'FEAT']
}
export type CommentFormData = z.infer<ReturnType<typeof createCommentFormSchema>>

/**
 * 验证图片文件
 */
export function validateImageFile(file: File, message: Ref<CustomConfig>): { isValid: boolean, error?: string } {
  try {
    const schema = createImageUploadSchema(message)
    schema.parse({ file })
    return { isValid: true }
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.issues[0]?.message || message.value.forum.validation.errors.invalidFile,
      }
    }
    return {
      isValid: false,
      error: message.value.forum.validation.errors.fileValidationFailed,
    }
  }
}

/**
 * 验证多个图片文件
 */
export function validateMultipleFiles(files: File[], message: Ref<CustomConfig>): { isValid: boolean, errors: string[] } {
  const errors: string[] = []

  if (files.length > VALIDATION_LIMITS.IMAGES.MAX_COUNT) {
    errors.push(`Cannot upload more than ${VALIDATION_LIMITS.IMAGES.MAX_COUNT} files`)
  }

  for (let i = 0; i < files.length; i++) {
    const result = validateImageFile(files[i], message)
    if (!result.isValid && result.error) {
      errors.push(`File ${i + 1}: ${result.error}`)
    }
  }

  return { isValid: errors.length === 0, errors }
}

// Re-export from centralized text utils
export { sanitizeHtml, truncateText } from '../../../../.vitepress/theme/utils/text'
