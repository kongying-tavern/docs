import type { Ref } from 'vue'
import type { CustomConfig } from '../../../../.vitepress/locales/types'
import { ref } from 'vue'
import { z } from 'zod'
import { VALIDATION_LIMITS } from '../constants'

// Dynamic Zod schemas for form validation - pass message ref from component
export function createTopicFormSchema(message: Ref<CustomConfig>) {
  return z.object({
    title: z.string()
      .min(VALIDATION_LIMITS.TITLE.MIN_LENGTH, message.value.forum.validation.errors.contentTooShort.replace('{min}', String(VALIDATION_LIMITS.TITLE.MIN_LENGTH)))
      .max(VALIDATION_LIMITS.TITLE.MAX_LENGTH, message.value.forum.validation.errors.contentTooLong.replace('{max}', String(VALIDATION_LIMITS.TITLE.MAX_LENGTH)))
      .trim(),

    content: z.string()
      .min(VALIDATION_LIMITS.CONTENT.MIN_LENGTH, message.value.forum.validation.errors.contentTooShort.replace('{min}', String(VALIDATION_LIMITS.CONTENT.MIN_LENGTH)))
      .max(VALIDATION_LIMITS.CONTENT.MAX_LENGTH, message.value.forum.validation.errors.contentTooLong.replace('{max}', String(VALIDATION_LIMITS.CONTENT.MAX_LENGTH)))
      .trim(),

    tags: z.array(z.string().max(VALIDATION_LIMITS.TAGS.MAX_TAG_LENGTH))
      .min(VALIDATION_LIMITS.TAGS.MIN_COUNT, message.value.forum.validation.errors.tagsRequired.replace('{min}', String(VALIDATION_LIMITS.TAGS.MIN_COUNT)))
      .max(VALIDATION_LIMITS.TAGS.MAX_COUNT, message.value.forum.validation.errors.tooManyTagsLimit.replace('{max}', String(VALIDATION_LIMITS.TAGS.MAX_COUNT))),

    type: z.enum(['FEAT', 'BUG', 'ANN']),

    images: z.array(z.object({
      src: z.string().url(),
      alt: z.string().optional(),
      title: z.string().optional(),
      thumbHash: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })).max(VALIDATION_LIMITS.IMAGES.MAX_COUNT).optional(),
  })
}

export function createCommentFormSchema(message: Ref<CustomConfig>) {
  return z.object({
    content: z.string()
      .min(1, message.value.forum.validation.errors.commentEmpty)
      .max(VALIDATION_LIMITS.CONTENT.MAX_LENGTH, message.value.forum.validation.errors.contentTooLong.replace('{max}', String(VALIDATION_LIMITS.CONTENT.MAX_LENGTH)))
      .trim(),

    replyTarget: z.string().optional(),
  })
}

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

// Legacy schemas for backward compatibility - using fallback English messages
const fallbackMessages: CustomConfig = {
  forum: {
    validation: {
      errors: {
        titleRequired: 'Topic title is required',
        contentRequired: 'Topic content is required',
        authorRequired: 'Topic author is required',
        tooManyTags: 'Too many tags (max 10)',
        contentTooShort: 'Content must be at least {min} characters',
        contentTooLong: 'Content must be no more than {max} characters',
        tagsRequired: 'At least {min} tag is required',
        tooManyTagsLimit: 'No more than {max} tags allowed',
        tagTooLong: 'Tag "{tag}" exceeds maximum length of {maxLength} characters',
        commentEmpty: 'Comment cannot be empty',
        invalidImageFormat: 'Only JPEG, PNG, GIF, and WebP images are allowed',
        validationError: 'Validation error occurred',
        invalidFile: 'Invalid file',
        fileValidationFailed: 'File validation failed',
      },
    },
  },
} as CustomConfig

const fallbackMessagesRef = ref(fallbackMessages)

export const topicFormSchema = createTopicFormSchema(fallbackMessagesRef)
export const commentFormSchema = createCommentFormSchema(fallbackMessagesRef)
export const imageUploadSchema = createImageUploadSchema(fallbackMessagesRef)

export type TopicFormData = z.infer<typeof topicFormSchema>
export type CommentFormData = z.infer<typeof commentFormSchema>

export interface ValidationResult {
  success: boolean
  data?: unknown
  errors?: Record<string, string[]> | null
}

// Validation helper functions
export function validateTopicForm(data: unknown): ValidationResult {
  try {
    const validData = topicFormSchema.parse(data)
    return {
      success: true,
      data: validData,
      errors: null,
    }
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.flatten().fieldErrors,
      }
    }
    return {
      success: false,
      data: null,
      errors: { _form: ['Validation error occurred'] },
    }
  }
}

export function validateCommentForm(data: unknown): ValidationResult {
  try {
    const validData = commentFormSchema.parse(data)
    return {
      success: true,
      data: validData,
      errors: null,
    }
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.flatten().fieldErrors,
      }
    }
    return {
      success: false,
      data: null,
      errors: { _form: ['Validation error occurred'] },
    }
  }
}

export function validateImageUpload(file: File): { success: boolean, error?: string } {
  try {
    imageUploadSchema.parse({ file })
    return { success: true }
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Invalid file',
      }
    }
    return {
      success: false,
      error: 'File validation failed',
    }
  }
}

// Simple validation functions for individual fields
export function validateImageFile(file: File): { isValid: boolean, errors: string[] } {
  const result = validateImageUpload(file)
  return {
    isValid: result.success,
    errors: result.error ? [result.error] : [],
  }
}

export function validateContent(content: string, message?: Ref<CustomConfig>): { isValid: boolean, errors: string[] } {
  const msg = message?.value || fallbackMessages
  const errors: string[] = []

  if (content.length < VALIDATION_LIMITS.CONTENT.MIN_LENGTH) {
    errors.push(msg.forum.validation.errors.contentTooShort.replace('{min}', String(VALIDATION_LIMITS.CONTENT.MIN_LENGTH)))
  }

  if (content.length > VALIDATION_LIMITS.CONTENT.MAX_LENGTH) {
    errors.push(msg.forum.validation.errors.contentTooLong.replace('{max}', String(VALIDATION_LIMITS.CONTENT.MAX_LENGTH)))
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateTags(tags: string[], message?: Ref<CustomConfig>): { isValid: boolean, errors: string[] } {
  const msg = message?.value || fallbackMessages
  const errors: string[] = []

  if (tags.length < VALIDATION_LIMITS.TAGS.MIN_COUNT) {
    errors.push(msg.forum.validation.errors.tagsRequired.replace('{min}', String(VALIDATION_LIMITS.TAGS.MIN_COUNT)))
  }

  if (tags.length > VALIDATION_LIMITS.TAGS.MAX_COUNT) {
    errors.push(msg.forum.validation.errors.tooManyTagsLimit.replace('{max}', String(VALIDATION_LIMITS.TAGS.MAX_COUNT)))
  }

  for (const tag of tags) {
    if (tag.length > VALIDATION_LIMITS.TAGS.MAX_TAG_LENGTH) {
      errors.push(msg.forum.validation.errors.tagTooLong.replace('{tag}', tag).replace('{maxLength}', String(VALIDATION_LIMITS.TAGS.MAX_TAG_LENGTH)))
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateMultipleFiles(files: File[]): { isValid: boolean, errors: string[] } {
  if (files.length > VALIDATION_LIMITS.IMAGES.MAX_COUNT) {
    return {
      isValid: false,
      errors: [`Cannot upload more than ${VALIDATION_LIMITS.IMAGES.MAX_COUNT} files`],
    }
  }

  const allErrors: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const validation = validateImageFile(file)

    if (!validation.isValid) {
      allErrors.push(...validation.errors.map(error => `File ${i + 1}: ${error}`))
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  }
}

// Additional validation utilities
export function isValidUsername(username: string): boolean {
  return /^[\w-]+$/.test(username) && username.length >= 3 && username.length <= 20
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email)
}

// Re-export from centralized text utils
export { sanitizeHtml, truncateText } from '../../../../.vitepress/theme/utils/text'
