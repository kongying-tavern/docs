export * from './api-helpers'
export {
  buildCommentsQueryParams,
  buildTopicsQueryParams,
  getErrorMessage,
  isNetworkError,
  isNotFoundError,
  isPermissionError,
  processCommentsResponse,
  processTopicsResponse,
} from './api-helpers'
export * from './data-helpers'
export {
  flattenWithTags,
  generateId,
  getRandomElements,
  groupBy,
  publishTopic,
  setPageTitle,
  slugify,
  sortBy,
  transformLabelsToArray,
  uniqueBy,
} from './data-helpers'
export * from './dom-utils'

export {
  copyToClipboard,
  debounce,
  focusElement,
  isElementInViewport,
  scrollTo,
  throttle,
  updateUrlHash,
  updateUrlPath,
} from './dom-utils'

export * from './formatting'

export {
  formatCount,
  formatFileSize,
  formatForumDate,
  formatMarkdownImages,
  formatPlainText,
  formatRelativeDate,
  formatAtMentions as replaceAtMentions,
} from './formatting'

// Export all utility functions
export * from './validation'

// Re-export commonly used functions for convenience
export {
  validateCommentForm,
  validateContent,
  validateImageFile,
  validateImageUpload,
  validateTags,
  validateTopicForm,
} from './validation'
