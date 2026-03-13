# Forum 模块架构文档

## 概述

Forum模块是一个基于Vue 3 + TypeScript + Pinia的现代化论坛系统，集成了Gitee Issues API，支持多语言、实时同步、性能优化等特性。

## 🏗️ 整体架构

```
Forum 系统架构
├── 数据层 (Data Layer)
│   ├── Store管理 (Pinia Stores)
│   ├── 缓存系统 (Cache System)
│   └── API接口 (Gitee API)
├── 业务逻辑层 (Business Logic)
│   ├── 事件系统 (Event System)
│   ├── 状态管理 (State Management)
│   └── 数据处理 (Data Processing)
├── 组件层 (Component Layer)
│   ├── 页面组件 (Page Components)
│   ├── UI组件 (UI Components)
│   └── 表单组件 (Form Components)
└── 工具层 (Utility Layer)
    ├── Composables
    ├── 工具函数 (Utilities)
    └── 类型定义 (Types)
```

## 📁 文件结构

```
src/components/forum/
├── README.md                    # 本文档
├── CROSS_PAGE_SYNC.md          # 跨页面同步机制说明
├── ForumTopic.scss             # 主题样式
├──
├── 📂 base/                    # 基础组件
│   ├── BaseForumPage.vue       # 论坛页面基础布局
│   └── BaseTopicCard.vue       # 话题卡片基础组件
├──
├── 📂 comment/                 # 评论相关组件
│   ├── ForumCommentArea.vue    # 评论区域
│   ├── ForumCommentForm.vue    # 评论表单
│   └── ForumCommentList.vue    # 评论列表
├──
├── 📂 composables/             # 业务逻辑Composables
│   ├── useTopicImageGrid.ts    # 话题图片网格
│   └── useTopicInteraction.ts  # 话题交互逻辑
├──
├── 📂 constants/               # 常量定义
│   ├── index.ts                # 导出所有常量
│   ├── filters.ts              # 筛选器常量
│   ├── sorts.ts               # 排序常量
│   └── ui.ts                  # UI相关常量
├──
├── 📂 events/                  # 事件系统
│   └── ForumEventBus.ts        # 老事件总线(保留兼容)
├──
├── 📂 form/                    # 表单组件
│   ├── ForumPublishForm.vue    # 发布表单
│   ├── ForumContentEditor.vue  # 内容编辑器
│   └── ForumTagsInput.vue      # 标签输入
├──
├── 📂 topic/                   # 话题相关组件
│   ├── ForumTopicPage.vue      # 话题详情页
│   ├── ForumTopicContent.vue   # 话题内容
│   ├── ForumTopicHeader.vue    # 话题头部
│   ├── ForumTopicMedia.vue     # 话题媒体
│   ├── ForumTopicFooter.vue    # 话题底部
│   ├── types.ts               # 话题类型定义
│   └── 📂 composables/
│       ├── useTopicPageState.ts    # 话题页面状态
│       └── useTopicImageGrid.ts    # 话题图片网格
├──
├── 📂 ui/                      # UI组件库
│   ├── ForumButton.vue         # 按钮组件
│   ├── ForumLoadState.vue      # 加载状态
│   ├── ForumRoleBadge.vue      # 角色徽章
│   ├── ForumTagList.vue        # 标签列表
│   ├── ForumTime.vue           # 时间显示
│   └── ForumTopicTypeBadge.vue # 话题类型徽章
├──
├── 📂 user/                    # 用户相关组件
│   ├── ForumUserPage.vue       # 用户页面
│   ├── ForumUserHoverCard.vue  # 用户悬浮卡片
│   ├── ForumUserProfileHeader.vue # 用户资料头部
│   └── 📂 composables/
│       └── useUserProfile.ts   # 用户资料逻辑
├──
├── 📂 utils/                   # 工具函数
│   ├── index.ts               # 导出所有工具
│   ├── dom-utils.ts           # DOM操作
│   ├── text-utils.ts          # 文本处理
│   └── date-utils.ts          # 日期处理
├──
├── ForumHome.vue              # 论坛首页
├── ForumLayout.vue            # 论坛布局
├── ForumAside.vue             # 侧边栏
├── ForumLocalNav.vue          # 本地导航
├── ForumTopicsList.vue        # 话题列表
├── ForumTopicMenubar.vue      # 话题菜单栏
├── ForumSearchbox.vue         # 搜索框
├── ForumSearchCurtain.vue     # 搜索帘幕
├── ForumSearchSuggestions.vue # 搜索建议
├── ForumTopicDropdownMenu.vue # 话题下拉菜单
├── ForumTopicTagsEditorDialog.vue # 标签编辑对话框
├── ForumTopicTypeDropdown.vue # 话题类型下拉
├── ForumTopicTranslator.vue   # 话题翻译器
├── shared.ts                  # 共享工具
├── types.d.ts                 # 类型定义
└── utils.ts                   # 工具函数
```

## 🗃️ 数据层架构

### Store 管理

```typescript
// 三个主要Store，各自负责不同页面的数据管理
├── useForumHomeStore    # 首页数据管理
├── useForumUserStore    # 用户页面数据管理
└── useForumTopicStore   # 话题详情页数据管理
```

#### 1. useForumHomeStore

```typescript
interface ForumHomeStore {
  // 状态
  data: ComputedRef<ForumAPI.Topic[]>; // 主话题列表
  userSubmittedTopics: Ref<ForumAPI.Topic[]>; // 用户提交的话题
  pinnedTopicsData: ComputedRef<ForumAPI.Topic[]>; // 置顶话题

  // 查询状态
  sort: Ref<ForumAPI.SortMethod>; // 排序方式
  filter: Ref<ForumAPI.FilterBy>; // 筛选方式
  isSearching: Ref<boolean>; // 搜索状态

  // 分页状态
  loading: Ref<boolean>; // 加载状态
  canLoadMore: Ref<boolean>; // 可否加载更多
  totalPage: Ref<number>; // 总页数

  // 操作方法
  loadForumData: (params?) => Promise<void>; // 加载数据
  searchTopics: (query) => Promise<void>; // 搜索话题
  loadMoreTopics: () => Promise<void>; // 加载更多
  resetState: () => void; // 重置状态

  // 话题操作
  addTopic: (topic) => void; // 添加话题
  removeTopic: (id) => void; // 删除话题
  updateTopic: (id, updates) => void; // 更新话题

  // 事件管理
  setupEventListeners: () => void; // 设置事件监听
}
```

#### 2. useForumUserStore

```typescript
interface ForumUserStore {
  // 继承基础Store的所有属性和方法
  creator: Ref<string | null>; // 当前用户

  // 用户特定方法
  loadUserData: (username) => Promise<void>; // 加载用户数据
}
```

#### 3. useForumTopicStore

```typescript
interface ForumTopicStore {
  // 话题详情状态
  currentTopicId: Ref<string | number | null>; // 当前话题ID
  topicDetail: Ref<ForumAPI.Topic | null>; // 话题详情

  // 话题操作
  loadTopicData: (topicId) => Promise<void>; // 加载话题数据
  setCurrentTopic: (topic) => void; // 设置当前话题
  updateCurrentTopic: (updates) => void; // 更新当前话题
}
```

### 缓存系统

```typescript
// 多层缓存架构
├── 浏览器缓存 (Browser Cache)
│   ├── LocalStorage (跨页面数据同步)
│   └── SessionStorage (会话数据)
├── 内存缓存 (Memory Cache)
│   ├── useTopicCache (话题缓存)
│   └── globalCacheLayer (全局缓存层)
└── Vue缓存 (Vue Cache)
    ├── Computed缓存 (计算属性缓存)
    └── Watch缓存 (监听器缓存)
```

## ⚡ 事件系统架构

### 新事件系统 (推荐使用)

```typescript
// 统一事件管理器
SimpleEventManager (单例模式)
├── subscribe<T>(eventType, handler): EventUnsubscribe
├── emit<T>(eventType, payload): void
└── clearListeners(eventType?): void

// 跨页面同步
SimpleCrossPageSync (单例模式)
├── enable(): void              // 启用跨页面同步
├── disable(): void             // 禁用跨页面同步
└── 自动localStorage同步机制

// Store事件处理器
SimpleStoreEventHandler
├── setupEventListeners(): void // 设置监听器
└── cleanup(): void             // 清理监听器
```

### 事件类型定义

```typescript
// 话题事件
'topic:created'     -> { topic: ForumAPI.Topic }
'topic:updated'     -> { id: string, updates: Partial<ForumAPI.Topic> }
'topic:deleted'     -> { id: string }
'topic:pinned'      -> { id: string, pinned: boolean }
'topic:visibility-changed' -> { id: string, hidden?: boolean, closed?: boolean }
'topic:tags-updated' -> { id: string, tags: string[] }
'topic:type-changed' -> { id: string, type: ForumAPI.TopicType }
'topic:comment-toggled' -> { id: string, commentsClosed: boolean }

// 评论事件
'comment:created'   -> { commentId: string|number, topicId: string, comment: ForumAPI.Comment }
'comment:updated'   -> { commentId: string|number, updates: Partial<ForumAPI.Comment> }
'comment:deleted'   -> { commentId: string|number, topicId: string }
'comment:hidden'    -> { commentId: string|number, topicId: string, hidden: boolean }

// UI事件
'ui:topic-expand'   -> { topicId: string, expanded: boolean }
'ui:comment-reply'  -> { topicId: string, targetUser: string }
'ui:search'         -> { query: string }
'ui:filter-change'  -> { filter: ForumAPI.FilterBy }
'ui:sort-change'    -> { sort: ForumAPI.SortMethod }

// 表单事件
'form:submit-start' -> { formType: string }
'form:submit-success' -> { formType: string, data: any }
'form:submit-error' -> { formType: string, error: Error }

// 导航事件
'nav:topic-detail'  -> { topicId: string }
'nav:user-profile'  -> { username: string }
'nav:back'          -> {}
```

### 事件使用示例

```typescript
// 1. 发射事件
import { forumEvents } from "~/services/events/SimpleEventManager";

// 话题操作
forumEvents.topicCreated(newTopic);
forumEvents.topicDeleted(topicId);
forumEvents.topicPinned(topicId, true);

// 表单操作
forumEvents.formSubmitStart("topic");
forumEvents.formSubmitSuccess("topic", data);

// 2. 监听事件
import { simpleEventManager } from "~/services/events/SimpleEventManager";

const unsubscribe = simpleEventManager.subscribe("topic:created", (payload) => {
  console.log("新话题创建:", payload.topic);
});

// 清理监听器
onUnmounted(() => {
  unsubscribe();
});

// 3. Store中的自动事件处理
const eventHandlers = new SimpleStoreEventHandler(topicOperations, {
  pageType: "home",
  currentUser: null,
});

onMounted(() => {
  eventHandlers.setupEventListeners();
  simpleCrossPageSync.enable(); // 启用跨页面同步
});
```

## 🔄 跨页面同步机制

### 工作原理

```typescript
// 事件流程
页面A: 用户操作 → API调用 → 成功 → 发射事件 → localStorage写入
     ↓
存储事件: StorageEvent触发
     ↓
页面B: 监听Storage → 解析事件 → 重新发射 → Store更新 → UI更新
```

### 防重复机制

```typescript
// 时间戳去重 (1秒窗口)
const recentEvents = new Set<string>();
function isRecentEvent(key: string): boolean {
  if (recentEvents.has(key)) return true;
  recentEvents.add(key);
  setTimeout(() => recentEvents.delete(key), 1000);
  return false;
}
```

### localStorage事件格式

```typescript
// 事件键格式: forum:topic:{action}
'forum:topic:deleted'     -> { topicId, timestamp }
'forum:topic:updated'     -> { topicId, updates, timestamp }
'forum:topic:pinned'      -> { topicId, pinned, timestamp }
'forum:topic:tags-updated' -> { topicId, tags, timestamp }
// ... 其他事件类型
```

## 🎯 核心Composables

### 数据管理类

#### useForumData

```typescript
interface UseForumDataReturn {
  // 数据状态
  data: Ref<ForumAPI.Topic[] | null>;
  pinnedTopicsData: Ref<ForumAPI.Topic[] | null>;

  // 加载状态
  loading: Ref<boolean>;
  isDataLoading: Ref<boolean>;

  // 分页状态
  totalPage: Ref<number>;
  canLoadMore: Ref<boolean>;
  noMore: Ref<boolean>;

  // 操作方法
  refreshData: (params?) => Promise<void>;
  loadMoreTopics: () => Promise<void>;
  initialData: () => void;
  resetState: () => void;
}

// 使用示例
const forumData = useForumData({
  manual: false, // 是否手动加载
  autoLoadPinned: true, // 是否自动加载置顶
});
```

#### useTopicCache

```typescript
interface UseTopicCacheReturn {
  getCachedTopic: (id: string) => ForumAPI.Topic | null;
  setCachedTopic: (topic: ForumAPI.Topic) => void;
  removeCachedTopic: (id: string) => void;
  clearCache: () => void;

  // 批量操作
  setCachedTopics: (topics: ForumAPI.Topic[]) => void;
  getCachedTopicsByIds: (ids: string[]) => ForumAPI.Topic[];
}
```

### 操作管理类

#### useTopicManger

```typescript
interface UseTopicMangerReturn {
  // 话题操作
  toggleTopicType: (newType: ForumAPI.TopicType) => Promise<boolean>;
  toggleTopicHidden: (willBeHidden?: boolean) => Promise<boolean>;
  toggleTopicClosed: (willBeClosed?: boolean) => Promise<boolean>;
  togglePinedTopic: () => Promise<boolean>;
  toggleTopicComments: () => Promise<boolean>;
  updateTopicTags: (newTags: string[]) => Promise<boolean>;

  // 状态查询
  isTopicHidden: ComputedRef<boolean>;
  isTopicClosed: ComputedRef<boolean>;
  isTopicPinned: ComputedRef<boolean>;
  isCommentsClosed: ComputedRef<boolean>;
}

// 使用示例
const topicManger = useTopicManger(topic, message);
await topicManger.toggleTopicType("SUGGESTION");
```

#### useSubmitTopic

```typescript
interface UseSubmitTopicReturn {
  data: Ref<ForumAPI.Topic | null>; // 提交结果
  loading: Ref<boolean>; // 提交状态
  error: Ref<Error | null>; // 错误信息
  submitData: (
    options: ForumAPI.CreateTopicOption,
  ) => Promise<ForumAPI.Topic | null>;
}

// 使用示例
const { submitData, loading } = useSubmitTopic();
const result = await submitData({
  title: "话题标题",
  text: "话题内容",
  tags: ["tag1", "tag2"],
  type: "SUGGESTION",
});
```

### UI交互类

#### useTopicInteraction

```typescript
interface UseTopicInteractionReturn {
  // 展开状态
  isExpanded: Ref<boolean>;
  toggleExpanded: () => void;

  // 评论相关
  showComments: Ref<boolean>;
  toggleComments: () => void;

  // 导航相关
  navigateToTopic: () => void;
  navigateToUser: () => void;

  // 搜索相关
  searchQuery: Ref<string>;
  performSearch: () => void;
}
```

#### useSearchInput

```typescript
interface UseSearchInputReturn {
  searchQuery: Ref<string>; // 搜索查询
  searchResults: Ref<ForumAPI.Topic[]>; // 搜索结果
  isSearching: Ref<boolean>; // 搜索状态
  searchHistory: Ref<string[]>; // 搜索历史

  performSearch: (query?: string) => Promise<void>;
  clearSearch: () => void;
  addToHistory: (query: string) => void;
  clearHistory: () => void;
}
```

## 🔌 API接口

### Gitee Issues API 封装

```typescript
// 主要API接口
interface IssuesAPI {
  // 话题相关
  getTopics: (params: ForumAPI.GetTopicsParams) => Promise<ForumAPI.Topic[]>;
  getTopic: (id: string) => Promise<ForumAPI.Topic>;
  postTopic: (data: ForumAPI.CreateTopicOption) => Promise<ForumAPI.Topic>;
  updateTopic: (
    id: string,
    data: Partial<ForumAPI.Topic>,
  ) => Promise<ForumAPI.Topic>;
  deleteTopic: (id: string) => Promise<void>;

  // 评论相关
  getTopicComments: (
    repo: string,
    params: ForumAPI.GetCommentsParams,
    topicId: string,
  ) => Promise<ForumAPI.Comment[]>;
  postComment: (
    data: ForumAPI.CreateCommentOption,
  ) => Promise<ForumAPI.Comment>;
  updateComment: (
    id: string | number,
    data: Partial<ForumAPI.Comment>,
  ) => Promise<ForumAPI.Comment>;
  deleteComment: (id: string | number) => Promise<void>;

  // 标签相关
  getLabels: () => Promise<ForumAPI.Label[]>;
  createLabel: (data: ForumAPI.CreateLabelOption) => Promise<ForumAPI.Label>;

  // 用户相关
  getUserTopics: (
    username: string,
    params: ForumAPI.GetTopicsParams,
  ) => Promise<ForumAPI.Topic[]>;
}
```

### 查询参数类型

```typescript
interface GetTopicsParams {
  state?: "open" | "closed" | "progressing" | "all"; // 状态筛选
  sort?: "created" | "updated" | "priority"; // 排序方式
  direction?: "asc" | "desc"; // 排序方向
  creator?: string; // 创建者
  labels?: string; // 标签筛选
  page?: number; // 页码
  per_page?: number; // 每页数量
  since?: string; // 起始时间
  searchQuery?: string | string[]; // 搜索查询
}

interface CreateTopicOption {
  title: string; // 话题标题
  body: string; // 话题内容
  labels?: string; // 标签 (逗号分隔)
  assignee?: string; // 分配者
  milestone?: number; // 里程碑
}
```

## 🎨 UI组件规范

### 组件分类

```typescript
// 1. 基础组件 (Base Components)
BaseForumPage; // 页面布局基础
BaseTopicCard; // 话题卡片基础

// 2. 业务组件 (Business Components)
ForumTopicsList; // 话题列表
ForumCommentArea; // 评论区域
ForumPublishForm; // 发布表单

// 3. UI组件 (UI Components)
ForumButton; // 按钮
ForumLoadState; // 加载状态
ForumRoleBadge; // 角色徽章
ForumTagList; // 标签列表

// 4. 复合组件 (Composite Components)
ForumTopicDropdownMenu; // 话题下拉菜单
ForumTopicTagsEditorDialog; // 标签编辑对话框
```

### Props 设计规范

```typescript
// 统一的Props接口设计
interface BaseProps {
  class?: string | string[] | Record<string, boolean>;
  style?: string | CSSProperties;
  id?: string;
}

interface TopicProps extends BaseProps {
  topic: ForumAPI.Topic; // 必需的话题数据
  viewMode?: FORUM.TopicViewMode; // 可选的视图模式
  readonly?: boolean; // 是否只读
  compact?: boolean; // 是否紧凑模式
}

interface ListProps<T> extends BaseProps {
  data: T[]; // 列表数据
  loading?: boolean; // 加载状态
  loadMore?: () => void; // 加载更多回调
  emptyText?: string; // 空状态文本
}
```

### 事件发射规范

```typescript
// 统一的事件发射格式
interface ComponentEmits {
  // 操作事件
  click: [event: MouseEvent];
  submit: [data: any];
  cancel: [];

  // 状态变更事件
  "update:modelValue": [value: any];
  change: [value: any, oldValue: any];

  // 生命周期事件
  mounted: [];
  destroyed: [];

  // 自定义业务事件
  "topic:select": [topic: ForumAPI.Topic];
  "topic:delete": [topicId: string];
}
```

## 🔧 工具函数

### 文本处理

```typescript
// 文本工具函数
export interface TextUtils {
  truncateText: (text: string, maxLength: number) => string;
  highlightKeywords: (text: string, keywords: string[]) => string;
  extractMentions: (text: string) => string[];
  sanitizeMarkdown: (markdown: string) => string;
  parseMarkdown: (markdown: string) => string;
}
```

### 日期处理

```typescript
// 日期工具函数
export interface DateUtils {
  formatRelativeTime: (date: string | Date) => string;
  formatAbsoluteTime: (date: string | Date) => string;
  isToday: (date: string | Date) => boolean;
  isThisWeek: (date: string | Date) => boolean;
  groupByDate: <T>(
    items: T[],
    getDate: (item: T) => Date,
  ) => Record<string, T[]>;
}
```

### DOM操作

```typescript
// DOM工具函数
export interface DOMUtils {
  scrollToElement: (selector: string, offset?: number) => void;
  copyToClipboard: (text: string) => Promise<boolean>;
  downloadFile: (url: string, filename: string) => void;
  updateUrlHash: (hash: string) => void;
  debounce: <T extends (...args: any[]) => any>(fn: T, delay: number) => T;
  throttle: <T extends (...args: any[]) => any>(fn: T, delay: number) => T;
}
```

## 🔍 类型定义

### 核心数据类型

```typescript
// 话题类型
interface Topic {
  id: string | number;
  title: string;
  content: {
    text: string;
    images?: Array<{
      src: string;
      alt: string;
      width?: number;
      height?: number;
      thumbHash?: string;
    }>;
  };
  type: TopicType;
  state: "open" | "closed" | "progressing";
  tags: string[];
  user: User;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
  pinned: boolean;
  language?: string;
  relatedComments?: Comment[];
}

// 话题类型枚举
type TopicType = "SUGGESTION" | "BUG" | "QUESTION" | "ANNOUNCEMENT" | "ANN";

// 用户类型
interface User {
  id: string | number;
  login: string;
  username: string;
  avatar: string;
  url: string;
  htmlUrl: string;
  type: "User" | "Organization";
}

// 评论类型
interface Comment {
  id: string | number;
  body: string;
  user: User;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
}
```

### UI状态类型

```typescript
// 视图模式
type TopicViewMode = "Card" | "List" | "compact";

// 筛选方式
type FilterBy = "all" | "open" | "closed" | "progressing" | "pinned";

// 排序方式
type SortMethod = "created" | "updated" | "priority" | "comments";

// 加载状态
interface LoadingState {
  loading: boolean;
  error: Error | null;
  message: string;
}

// 分页状态
interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}
```

## 🚀 性能优化

### 虚拟列表

```typescript
// 大数据量列表优化
const { virtualList, containerRef, wrapperRef } = useVirtualList(data, {
  itemHeight: 120, // 固定高度
  overscan: 5, // 预渲染数量
  onScroll: handleScroll,
  onReachBottom: loadMore,
});
```

### 图片懒加载

```typescript
// 图片懒加载配置
const { imgRef, isLoaded } = useLazyImage({
  src: computed(() => image.src),
  placeholder: "/placeholder.png",
  errorImg: "/error.png",
  threshold: 0.1, // 触发阈值
  rootMargin: "50px", // 根边距
});
```

### 缓存策略

```typescript
// 多级缓存配置
const cacheConfig = {
  // L1: 内存缓存 (最快)
  memory: {
    maxSize: 100, // 最大缓存数量
    ttl: 5 * 60 * 1000, // 5分钟过期
  },

  // L2: localStorage (持久)
  storage: {
    maxSize: 500,
    ttl: 24 * 60 * 60 * 1000, // 24小时过期
  },

  // L3: IndexedDB (大容量)
  indexedDB: {
    dbName: "ForumCache",
    version: 1,
    maxSize: 1000,
  },
};
```

## 🔒 权限管理

### 权限检查

```typescript
// 权限验证Composable
const { hasPermission, hasAnyPermissions } = useRuleChecks();

// 权限类型
type Permission =
  | "manage_feedback" // 管理反馈
  | "delete_topic" // 删除话题
  | "pin_topic" // 置顶话题
  | "edit_topic" // 编辑话题
  | "moderate_comment"; // 管理评论

// 使用示例
if (hasPermission("manage_feedback")) {
  // 显示管理员功能
}
```

### 角色系统

```typescript
// 用户角色
type UserRole = "admin" | "moderator" | "user" | "guest";

// 角色权限映射
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    "manage_feedback",
    "delete_topic",
    "pin_topic",
    "edit_topic",
    "moderate_comment",
  ],
  moderator: ["pin_topic", "edit_topic", "moderate_comment"],
  user: ["edit_topic"], // 仅自己的话题
  guest: [], // 无权限
};
```

## 📱 响应式设计

### 断点配置

```typescript
// 响应式断点
const breakpoints = {
  sm: "640px", // 手机
  md: "768px", // 平板
  lg: "1024px", // 桌面
  xl: "1280px", // 大屏
  "2xl": "1536px", // 超大屏
};

// 响应式Composable
const { isMobile, isTablet, isDesktop } = useResponsive();
```

### 移动端适配

```typescript
// 移动端特殊处理
const mobileAdaptations = {
  touchGestures: true, // 启用触摸手势
  pullToRefresh: true, // 下拉刷新
  infiniteScroll: true, // 无限滚动
  optimizedImages: true, // 图片优化
  reducedAnimations: true, // 减少动画
};
```

## 🌐 国际化支持

### 多语言配置

```typescript
// 支持的语言
type SupportedLocale = "zh" | "en" | "ja";

// 语言资源结构
interface ForumMessages {
  forum: {
    title: string;
    search: {
      placeholder: string;
      noResults: string;
      suggestions: string[];
    };
    topic: {
      create: string;
      edit: string;
      delete: string;
      pin: string;
      close: string;
    };
    comment: {
      add: string;
      edit: string;
      delete: string;
      reply: string;
    };
    auth: {
      loginRequired: string;
      loginTips: string;
    };
    errors: {
      loadFailed: string;
      submitFailed: string;
      networkError: string;
    };
  };
}
```

## 🧪 测试指南

### 组件测试

```typescript
// 组件测试示例
describe("ForumTopicCard", () => {
  it("should render topic correctly", () => {
    const topic = mockTopic();
    const wrapper = mount(ForumTopicCard, {
      props: { topic },
    });

    expect(wrapper.find('[data-testid="topic-title"]').text()).toBe(
      topic.title,
    );
    expect(wrapper.find('[data-testid="topic-author"]').text()).toBe(
      topic.user.username,
    );
  });

  it("should emit topic:select on click", async () => {
    const wrapper = mount(ForumTopicCard, {
      props: { topic: mockTopic() },
    });

    await wrapper.trigger("click");
    expect(wrapper.emitted("topic:select")).toBeTruthy();
  });
});
```

### Store测试

```typescript
// Store测试示例
describe("useForumHomeStore", () => {
  it("should load forum data correctly", async () => {
    const store = useForumHomeStore();
    await store.loadForumData();

    expect(store.data.value).toHaveLength(10);
    expect(store.loading.value).toBe(false);
  });

  it("should handle topic creation", () => {
    const store = useForumHomeStore();
    const newTopic = mockTopic();

    store.addTopic(newTopic);
    expect(store.userSubmittedTopics.value).toContain(newTopic);
  });
});
```

## 🔧 开发工具

### 调试工具

```typescript
// 开发模式调试
if (import.meta.env.DEV) {
  // 全局暴露调试接口
  window.__FORUM_DEBUG__ = {
    stores: { forumHomeStore, forumUserStore, forumTopicStore },
    eventManager: simpleEventManager,
    crossPageSync: simpleCrossPageSync,
    cache: globalCacheLayer,
  };
}
```

### 性能监控

```typescript
// 性能监控
const performanceMonitor = useForumPerformanceMonitor({
  enableMetrics: true,
  trackUserActions: true,
  reportInterval: 30000, // 30秒上报一次
});
```

## 📋 最佳实践

### 1. 组件设计原则

- **单一职责**: 每个组件只负责一个功能
- **可复用性**: 设计通用的Props接口
- **可测试性**: 避免复杂的内部状态
- **性能优化**: 合理使用computed和watch

### 2. 状态管理原则

- **数据单向流动**: Props down, Events up
- **最小化状态**: 优先使用computed而非reactive
- **事件驱动**: 使用事件系统解耦组件
- **缓存策略**: 合理使用多级缓存

### 3. 性能优化原则

- **懒加载**: 按需加载组件和数据
- **虚拟滚动**: 大列表使用虚拟滚动
- **防抖节流**: 搜索和滚动事件处理
- **缓存策略**: 多级缓存提升响应速度

### 4. 错误处理原则

- **优雅降级**: 网络错误时显示缓存数据
- **用户友好**: 提供清晰的错误信息
- **自动重试**: 关键操作自动重试机制
- **日志记录**: 详细的错误日志便于调试

## 🚀 部署和运维

### 构建优化

```typescript
// 构建配置优化
const buildOptimization = {
  // 代码分割
  codeSplitting: {
    chunks: "async",
    vendor: ["vue", "pinia"],
    forum: ["./src/components/forum/**/*"],
  },

  // 压缩配置
  compression: {
    gzip: true,
    brotli: true,
    threshold: 1024,
  },

  // 缓存配置
  caching: {
    assets: "1y", // 静态资源1年
    data: "1h", // 数据接口1小时
    api: "5m", // API接口5分钟
  },
};
```

### 监控指标

```typescript
// 关键监控指标
const metrics = {
  performance: {
    pageLoadTime: "< 2s", // 页面加载时间
    firstContentfulPaint: "< 1s", // 首次内容绘制
    interactionReady: "< 1.5s", // 可交互时间
  },

  functionality: {
    topicLoadSuccess: "> 99%", // 话题加载成功率
    commentPostSuccess: "> 98%", // 评论发布成功率
    searchResponse: "< 500ms", // 搜索响应时间
  },

  user: {
    bounceRate: "< 30%", // 跳出率
    avgSessionTime: "> 5min", // 平均会话时间
    pageViewsPerSession: "> 3", // 每会话页面浏览数
  },
};
```
