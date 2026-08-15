import type ForumAPI from '@/apis/forum/api'

// Forum configuration constants
export const FORUM_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_SORT: 'created' as ForumAPI.SortMethod,
  DEFAULT_PAGE: 1,
  DEFAULT_FILTER: 'all' as ForumAPI.FilterBy,
  DEFAULT_CREATOR: null,
  MAX_TITLE_LENGTH: 100,
  MAX_CONTENT_LENGTH: 2000,
  MAX_TAGS_COUNT: 5,
  MAX_UPLOAD_FILE_SIZE: 5, // MB
  LOAD_MORE_DISTANCE: 10,
  INFINITE_SCROLL_INTERVAL: 1500,
  TRANSITION_DURATION: 300,
} as const

// Form validation constants - 单一验证限制来源
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
    MAX_COUNT: 3,
    MAX_SIZE_MB: 6,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
} as const
