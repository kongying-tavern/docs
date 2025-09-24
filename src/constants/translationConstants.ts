// 语言显示名称映射
export const LOCALE_DISPLAY_NAMES = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
} as const

// 表格头部配置
export const TABLE_HEADERS = [
  { key: 'status', label: '状态', icon: 'i-lucide-circle-dot', width: 'w-[100px]' },
  { key: 'category', label: '分类', icon: 'i-lucide-folder', width: 'w-[120px]' },
  { key: 'key', label: '翻译键', icon: 'i-lucide-key', width: 'w-[200px]' },
  { key: 'actions', label: '操作', icon: 'i-lucide-settings', width: 'w-[120px]' },
] as const

// 分页配置
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const

// 导出配置
export const EXPORT_CONFIG = {
  FILE_TYPE: 'application/json',
  INDENT_SPACES: 2,
} as const

// 搜索防抖时间（毫秒）
export const SEARCH_DEBOUNCE_TIME = 300

// 变更类型
export const CHANGE_TYPES = {
  ADDED: 'added',
  MODIFIED: 'modified',
  DELETED: 'deleted',
} as const

// 排序配置
export const SORT_CONFIG = {
  DEFAULT_ORDER: 'asc',
  ORDERS: ['asc', 'desc'],
} as const

export type ChangeType = typeof CHANGE_TYPES[keyof typeof CHANGE_TYPES]
export type SortOrder = typeof SORT_CONFIG.ORDERS[number]
export type LocaleCode = keyof typeof LOCALE_DISPLAY_NAMES
