import { createLogger } from './logger'

export enum ForumLogGroup {
  PRELOADER = 'Preloader',
  BROADCAST = 'Broadcast',
  EVENT_MANAGER = 'EventManager',
  PERMISSION = 'Permission',
  PERFORMANCE = 'Performance',
  CACHE = 'Cache',
  SEARCH = 'Search',
  TOPIC = 'Topic',
  COMMENT = 'Comment',
  ADMIN = 'Admin',
  SERVICE = 'Service',
}

const forumLogger = createLogger<ForumLogGroup>({
  [ForumLogGroup.PRELOADER]: '#00BCD4',
  [ForumLogGroup.BROADCAST]: '#9C27B0',
  [ForumLogGroup.EVENT_MANAGER]: '#FF9800',
  [ForumLogGroup.PERMISSION]: '#4CAF50',
  [ForumLogGroup.PERFORMANCE]: '#E91E63',
  [ForumLogGroup.CACHE]: '#2196F3',
  [ForumLogGroup.SEARCH]: '#795548',
  [ForumLogGroup.TOPIC]: '#3F51B5',
  [ForumLogGroup.COMMENT]: '#009688',
  [ForumLogGroup.ADMIN]: '#607D8B',
  [ForumLogGroup.SERVICE]: '#FF5722',
})

export const forumLog = {
  debug: forumLogger.debug,
  info: forumLogger.info,
  success: forumLogger.success,
  warn: forumLogger.warn,
  error: forumLogger.error,
}
