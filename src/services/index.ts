// 类型定义
export type * from '../types/forum/simplified'

// 统一缓存层
export {
  CacheManager,
  cacheManager,
  CacheStrategy,
  globalCacheLayer,
  UnifiedCacheLayer,
} from './cache/UnifiedCacheLayer'

// 事件管理系统
export * from './events'

// Forum业务逻辑服务
export { ForumBusinessLogic, ForumOperationFactory } from './forum/ForumBusinessLogic'
