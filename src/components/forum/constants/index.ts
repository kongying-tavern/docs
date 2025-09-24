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

// Form validation constants
export const VALIDATION_LIMITS = {
  TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 100,
  },
  CONTENT: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 2000,
  },
  TAGS: {
    MIN_COUNT: 1,
    MAX_COUNT: 5,
    MAX_TAG_LENGTH: 20,
  },
  IMAGES: {
    MAX_COUNT: 9,
    MAX_SIZE_MB: 5,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
} as const

// UI constants
export const UI_CONSTANTS = {
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1440,
  },
  ANIMATION: {
    DURATION: {
      SHORT: 150,
      MEDIUM: 300,
      LONG: 500,
    },
    EASING: {
      DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
} as const

// Storage keys
export const STORAGE_KEYS = {
  FORUM_VIEW_MODE: 'FORUM-TOPIC-VIEW-MODE',
  FORUM_FORM_DATA: 'forum-publish-form-data',
  FORUM_DRAFT: 'forum-draft-',
} as const

// Route hashes
export const ROUTE_HASHES = {
  PUBLISH_FORM: 'publish-topic',
  LOGIN_ALERT: 'login-alert',
  REPLY_PREFIX: 'reply-',
} as const

// Topic type mappings
export const TOPIC_TYPE_CONFIG = {
  FEAT: {
    label: 'feature',
    icon: 'i-lucide-lightbulb',
    color: 'blue',
  },
  BUG: {
    label: 'bug',
    icon: 'i-lucide-bug',
    color: 'red',
  },
  ANN: {
    label: 'announcement',
    icon: 'i-lucide-megaphone',
    color: 'green',
  },
  POST: {
    label: 'post',
    icon: 'i-lucide-file-text',
    color: 'purple',
  },
} as const

// Filter sets
export const FILTER_SETS = {
  TOPIC_TYPES: new Set(['feat', 'bug', 'closed', 'all']),
  PERMISSIONS: new Set(['manage_feedback', 'admin', 'moderator']),
} as const

// Regex patterns
export const PATTERNS = {
  EMOJI: /\[([^[\]]*)\]/g,
  EXTRACT_EMOJI: /<img\s[^>]*data-emoji="\[([^[\]][^/[\]]*\/[^[\]]+)\]"[^>]*>/g,
  AT_MENTION: /@([a-z0-9]+)(?=\s|$)/gi,
  URL: /https?:\/\/(www\.)?[-\w@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-\w()@:%+.~#?&/=]*)/g,
} as const

// Error message keys - use with useLocalized().message.forum.errors
export const ERROR_MESSAGE_KEYS = {
  NETWORK_ERROR: 'networkError',
  VALIDATION_ERROR: 'validationError',
  PERMISSION_DENIED: 'permissionDenied',
  NOT_FOUND: 'notFound',
  SERVER_ERROR: 'serverError',
} as const

// Legacy error messages - DEPRECATED: Use translation keys instead
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed', // Use message.forum.errors.networkError
  VALIDATION_ERROR: 'Please check your input', // Use message.forum.errors.validationError
  PERMISSION_DENIED: 'Permission denied', // Use message.forum.errors.permissionDenied
  NOT_FOUND: 'Resource not found', // Use message.forum.errors.notFound
  SERVER_ERROR: 'Server error occurred', // Use message.forum.errors.serverError
} as const
