import type { Ref } from 'vue'
import type { CustomConfig } from '../../../../.vitepress/locales/types'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { VALIDATION_LIMITS } from '../constants'

/**
 * 创建话题表单验证 Schema (VeeValidate 兼容)
 * 使用 toTypedSchema 包装以支持 VeeValidate
 */
export function createTopicFormSchema(message: Ref<CustomConfig>) {
  const { forum } = message.value
  const { errors } = forum.validation

  return toTypedSchema(z.object({
    title: z.string()
      .min(VALIDATION_LIMITS.TITLE.MIN_LENGTH, errors.contentTooShort.replace('{min}', String(VALIDATION_LIMITS.TITLE.MIN_LENGTH)))
      .max(VALIDATION_LIMITS.TITLE.MAX_LENGTH, errors.contentTooLong.replace('{max}', String(VALIDATION_LIMITS.TITLE.MAX_LENGTH)))
      .trim(),

    text: z.string()
      .min(VALIDATION_LIMITS.CONTENT.MIN_LENGTH, errors.contentTooShort.replace('{min}', String(VALIDATION_LIMITS.CONTENT.MIN_LENGTH)))
      .max(VALIDATION_LIMITS.CONTENT.MAX_LENGTH, errors.contentTooLong.replace('{max}', String(VALIDATION_LIMITS.CONTENT.MAX_LENGTH)))
      .trim(),

    tags: z.array(z.string().max(VALIDATION_LIMITS.TAGS.MAX_TAG_LENGTH))
      .min(VALIDATION_LIMITS.TAGS.MIN_COUNT, errors.tagsRequired.replace('{min}', String(VALIDATION_LIMITS.TAGS.MIN_COUNT)))
      .max(VALIDATION_LIMITS.TAGS.MAX_COUNT, errors.tooManyTagsLimit.replace('{max}', String(VALIDATION_LIMITS.TAGS.MAX_COUNT))),

    type: z.enum(['FEAT', 'BUG', 'ANN']),
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
      .min(1, errors.commentEmpty)
      .max(VALIDATION_LIMITS.CONTENT.MAX_LENGTH, errors.contentTooLong.replace('{max}', String(VALIDATION_LIMITS.CONTENT.MAX_LENGTH)))
      .trim(),
  })
}

/**
 * 创建图片上传验证 Schema
 */
export function createImageUploadSchema(message: Ref<CustomConfig>) {
  return z.object({
    file: z.instanceof(File)
      .refine(
        (file: File) => file.size <= VALIDATION_LIMITS.IMAGES.MAX_SIZE_MB * 1024 * 1024,
        `File size must be less than ${VALIDATION_LIMITS.IMAGES.MAX_SIZE_MB}MB`,
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
