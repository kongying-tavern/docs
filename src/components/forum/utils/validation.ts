import { z } from 'zod'
import { VALIDATION_LIMITS } from '../constants'

// Zod schemas for form validation
export const topicFormSchema = z.object({
  title: z.string()
    .min(VALIDATION_LIMITS.TITLE.MIN_LENGTH, `Title must be at least ${VALIDATION_LIMITS.TITLE.MIN_LENGTH} characters`)
    .max(VALIDATION_LIMITS.TITLE.MAX_LENGTH, `Title must be no more than ${VALIDATION_LIMITS.TITLE.MAX_LENGTH} characters`)
    .trim(),

  content: z.string()
    .min(VALIDATION_LIMITS.CONTENT.MIN_LENGTH, `Content must be at least ${VALIDATION_LIMITS.CONTENT.MIN_LENGTH} characters`)
    .max(VALIDATION_LIMITS.CONTENT.MAX_LENGTH, `Content must be no more than ${VALIDATION_LIMITS.CONTENT.MAX_LENGTH} characters`)
    .trim(),

  tags: z.array(z.string().max(VALIDATION_LIMITS.TAGS.MAX_TAG_LENGTH))
    .min(VALIDATION_LIMITS.TAGS.MIN_COUNT, `At least ${VALIDATION_LIMITS.TAGS.MIN_COUNT} tag is required`)
    .max(VALIDATION_LIMITS.TAGS.MAX_COUNT, `No more than ${VALIDATION_LIMITS.TAGS.MAX_COUNT} tags allowed`),

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

export const commentFormSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(VALIDATION_LIMITS.CONTENT.MAX_LENGTH, `Comment must be no more than ${VALIDATION_LIMITS.CONTENT.MAX_LENGTH} characters`)
    .trim(),

  replyTarget: z.string().optional(),
})

export const imageUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(
      (file: File) => file.size <= VALIDATION_LIMITS.IMAGES.MAX_SIZE_MB * 1024 * 1024,
      `File size must be less than ${VALIDATION_LIMITS.IMAGES.MAX_SIZE_MB}MB`,
    )
    .refine(
      (file: File) => VALIDATION_LIMITS.IMAGES.ALLOWED_TYPES.includes(file.type as (typeof VALIDATION_LIMITS.IMAGES.ALLOWED_TYPES)[number]),
      'Only JPEG, PNG, GIF, and WebP images are allowed',
    ),
})

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

export function validateContent(content: string): { isValid: boolean, errors: string[] } {
  const errors: string[] = []

  if (content.length < VALIDATION_LIMITS.CONTENT.MIN_LENGTH) {
    errors.push(`Content must be at least ${VALIDATION_LIMITS.CONTENT.MIN_LENGTH} characters`)
  }

  if (content.length > VALIDATION_LIMITS.CONTENT.MAX_LENGTH) {
    errors.push(`Content must be no more than ${VALIDATION_LIMITS.CONTENT.MAX_LENGTH} characters`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateTags(tags: string[]): { isValid: boolean, errors: string[] } {
  const errors: string[] = []

  if (tags.length < VALIDATION_LIMITS.TAGS.MIN_COUNT) {
    errors.push(`At least ${VALIDATION_LIMITS.TAGS.MIN_COUNT} tag is required`)
  }

  if (tags.length > VALIDATION_LIMITS.TAGS.MAX_COUNT) {
    errors.push(`No more than ${VALIDATION_LIMITS.TAGS.MAX_COUNT} tags allowed`)
  }

  for (const tag of tags) {
    if (tag.length > VALIDATION_LIMITS.TAGS.MAX_TAG_LENGTH) {
      errors.push(`Tag "${tag}" exceeds maximum length of ${VALIDATION_LIMITS.TAGS.MAX_TAG_LENGTH} characters`)
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

export function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength)
    return text
  return `${text.slice(0, maxLength - 3)}...`
}
