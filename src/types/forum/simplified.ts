import type ForumAPI from '@/apis/forum/api'
import type { ComputedRef, Ref } from 'vue'

/**
 * 简化的Forum Store类型定义
 * 移除复杂的泛型继承，使用直接的接口定义
 */

// 基础状态类型
export interface ForumStoreState {
  // 数据状态
  data: Ref<ForumAPI.Topic[] | null>
  userSubmittedTopics: Ref<ForumAPI.Topic[]>
  pinnedTopicsData: Ref<ForumAPI.Topic[] | null>

  // UI状态
  sort: Ref<ForumAPI.SortMethod>
  filter: Ref<ForumAPI.FilterBy>
  isSearching: Ref<boolean>
  isFilterChanging: Ref<boolean>

  // 加载状态
  loading: Ref<boolean>
  isDataLoading: Ref<boolean>

  // 分页状态
  totalPage: Ref<number>
  total: Ref<number>
  canLoadMore: Ref<boolean>
  noMore: Ref<boolean>
  isFirstLoad: Ref<boolean>

  // 消息状态
  loadStateMessage: Ref<string>
}

// 基础操作类型
export interface ForumStoreActions {
  // 数据加载
  loadForumData: (params?: ForumQueryParams) => Promise<void>
  searchTopics: (query: string | string[], params?: Partial<ForumQueryParams>) => Promise<void>
  loadMoreTopics: () => Promise<void>
  resetState: (options?: ResetOptions) => void
  cleanup: () => void

  // Topic操作
  addTopic: (topic: ForumAPI.Topic) => void
  removeTopic: (id: ForumAPI.Topic['id']) => void
  updateTopic: (id: ForumAPI.Topic['id'], updates: Partial<ForumAPI.Topic>) => void
  replaceTopicTags: (id: ForumAPI.Topic['id'], tags: ForumAPI.Topic['tags']) => void
  changeTopicType: (id: ForumAPI.Topic['id'], type: ForumAPI.TopicType) => void
  changeTopicPinState: (id: ForumAPI.Topic['id'], pinned: boolean) => void
  updateTopicVisibility: (id: ForumAPI.Topic['id'], updates: VisibilityUpdates) => void

  // 预加载
  triggerPreload: () => void

  // 事件管理
  setupEventListeners: () => void
}

// 简化的配置类型
export interface ForumStoreConfig {
  pageType: PageType
  autoLoadPinned?: boolean
  manual?: boolean
  currentUser?: string | null
}

// 辅助类型
export type PageType = 'home' | 'user' | 'topic'

export interface ResetOptions {
  reloadData?: boolean
  clearUserTopics?: boolean
}

export interface VisibilityUpdates {
  hidden?: boolean
  closed?: boolean
}

export interface ForumQueryParams {
  page?: number
  pageSize?: number
  sort?: ForumAPI.SortMethod
  filter?: ForumAPI.FilterBy
  creator?: string
  searchQuery?: string
  [key: string]: any
}

// 完整的Store类型
export type ForumStore = ForumStoreState & ForumStoreActions

// 用户Store特有的状态
export interface UserForumStoreState extends ForumStoreState {
  creator: Ref<string | null>
}

// 用户Store特有的操作
export interface UserForumStoreActions extends ForumStoreActions {
  loadUserData: (username: string) => Promise<void>
}

// 用户Store类型
export type UserForumStore = UserForumStoreState & UserForumStoreActions

// 性能优化相关类型
export interface TopicIndexer {
  findById: (id: string | number) => ForumAPI.Topic | undefined
  findByUser: (username: string) => ForumAPI.Topic[]
  has: (id: string | number) => boolean
  size: number
}

export interface CacheStats {
  size: number
  maxSize: number
  hitRate: number
  memoryUsage: number
}

// 业务逻辑相关类型
export interface TopicValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ErrorInfo {
  message: string
  shouldRetry: boolean
  errorCode?: string
}

export interface MergeTopicsOptions {
  enableUserFilter?: boolean
  currentUser?: string | null
  deduplication?: boolean
}

// 事件相关类型（简化版）
export interface TopicEventPayload {
  topic?: ForumAPI.Topic
  id?: string | number
  updates?: Partial<ForumAPI.Topic>
  tags?: string[]
  type?: ForumAPI.TopicType
  pinned?: boolean
  hidden?: boolean
  closed?: boolean
}

export type TopicEventType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'pinned'
  | 'visibility-changed'
  | 'tags-updated'
  | 'type-changed'

// 组合式函数返回类型
export interface UseForumDataReturn {
  data: Ref<ForumAPI.Topic[] | null>
  pinnedTopicsData: Ref<ForumAPI.Topic[] | null>
  loading: Ref<boolean>
  isDataLoading: Ref<boolean>
  totalPage: Ref<number>
  total: Ref<number>
  canLoadMore: Ref<boolean>
  noMore: Ref<boolean>
  isFirstLoad: Ref<boolean>
  loadStateMessage: Ref<string>

  refreshData: (params?: ForumQueryParams) => Promise<void>
  searchTopics: (query: string | string[], params?: Partial<ForumQueryParams>) => Promise<void>
  loadMoreTopics: () => Promise<void>
  resetState: (options?: ResetOptions) => void
  initialData: () => void
}

export interface UseTopicCacheReturn {
  getCachedTopic: (id: string | number) => ForumAPI.Topic | undefined
  setCachedTopic: (topic: ForumAPI.Topic) => void
  removeCachedTopic: (id: string | number) => void
  clearCache: () => void
  hasCachedTopic: (id: string | number) => boolean
}

export interface UseEventHandlersReturn {
  setupEventListeners: () => void
  cleanup: () => void
}

// 工厂函数类型
export type StoreFactory<T = ForumStore> = (
  storeId: string,
  config: ForumStoreConfig
) => () => T

// 中间件类型
export interface StoreMiddleware<T = any> {
  beforeAction?: (actionName: string, payload: T) => T | Promise<T>
  afterAction?: (actionName: string, payload: T, result: any) => void
  onError?: (actionName: string, error: Error) => void
}

// 插件类型
export interface StorePlugin {
  install: (store: ForumStore, options?: any) => void
  uninstall?: (store: ForumStore) => void
}

// 性能监控类型
export interface PerformanceMetrics {
  renderCount: number
  updateCount: number
  lastUpdateTime: number
  averageUpdateTime: number
  memoryUsage: number
  cacheHitRate: number
}

// 导出常用的联合类型
export type ForumEventHandler<T = any> = (payload: T) => void | Promise<void>
export type EventUnsubscribe = () => void
export type AsyncOperation<T = void> = () => Promise<T>
export type SyncOperation<T = void> = () => T

// 类型守卫函数
export function isValidTopic(obj: any): obj is ForumAPI.Topic {
  return obj
    && typeof obj.id !== 'undefined'
    && typeof obj.title === 'string'
    && obj.content
    && typeof obj.content.text === 'string'
    && obj.user
    && typeof obj.user.login === 'string'
}

export function isValidForumQueryParams(obj: any): obj is ForumQueryParams {
  return obj && typeof obj === 'object'
}

// 实用工具类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// 响应式类型扩展
export type ReactiveForumStore = {
  [K in keyof ForumStore]: ForumStore[K] extends (...args: any[]) => any
    ? ForumStore[K]
    : ForumStore[K] extends Ref<infer U>
      ? Ref<U>
      : ForumStore[K] extends ComputedRef<infer U>
        ? ComputedRef<U>
        : Ref<ForumStore[K]>
}
