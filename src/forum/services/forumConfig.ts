// unocss.config.ts 经 jiti 加载本文件且不解析 `~` 别名，此依赖链只可用相对导入
import { SITE_MOBILE_BREAKPOINT_PX, SITE_MOBILE_MEDIA_QUERY } from '../../constants/breakpoints.ts'

export const FORUM_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
} as const

export const FORUM_MOBILE_BREAKPOINT_PX = SITE_MOBILE_BREAKPOINT_PX

export const FORUM_MOBILE_MEDIA_QUERY = SITE_MOBILE_MEDIA_QUERY

export const IMAGE_UPLOAD_POLICY = {
  MAX_COUNT: 4,
  MAX_BYTES: 6 * 1024 * 1024,
  MAX_SIZE_LABEL: '6 MiB',
  MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
  ],
} as const

export const IMAGE_UPLOAD_ACCEPT = IMAGE_UPLOAD_POLICY.MIME_TYPES.join(',')

export const VALIDATION_LIMITS = {
  TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
  },
  CONTENT: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 2000,
  },
  TAGS: {
    MIN_COUNT: 1,
    MAX_COUNT: 5,
    MAX_TAG_LENGTH: 20,
  },
  IMAGES: {
    MAX_COUNT: IMAGE_UPLOAD_POLICY.MAX_COUNT,
    MAX_BYTES: IMAGE_UPLOAD_POLICY.MAX_BYTES,
    MAX_SIZE_LABEL: IMAGE_UPLOAD_POLICY.MAX_SIZE_LABEL,
    ALLOWED_TYPES: IMAGE_UPLOAD_POLICY.MIME_TYPES,
  },
} as const

export const STORAGE_KEYS = {
  FORUM_FORM_DATA: 'forum-publish-form-data',
} as const
