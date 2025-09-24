import type { EnhancedBlogPost } from './useBlogData'
import type ForumAPI from '@/apis/forum/api'
import posts from '~/_data/posts.json'

/**
 * 博客分类结果接口
 */
export interface BlogPostCategories {
  /** 已发布的博客（来自posts.json静态数据） */
  published: EnhancedBlogPost[]
  /** 需要更新的博客（API版本比静态数据新） */
  needsUpdate: EnhancedBlogPost[]
  /** API草稿博客（tags包含DRAFT标签） */
  apiDrafts: EnhancedBlogPost[]
  /** 待发布博客（API中有但静态数据中没有，且不是草稿） */
  pending: EnhancedBlogPost[]
}

/**
 * 博客分类选项
 */
export interface BlogCategorizationOptions {
  /** 当前语言（用于过滤） */
  currentLang?: string
  /** 是否包含草稿 */
  includeDrafts?: boolean
  /** 是否包含待发布内容 */
  includePending?: boolean
  /** 是否包含需要更新的内容 */
  includeNeedsUpdate?: boolean
  /** 默认头像URL */
  defaultAvatar?: string
}

/**
 * 获取语言标签 - 匹配论坛系统的 LC- 前缀格式
 */
function getLanguageLabel(lang: string): string {
  const langMap: Record<string, string> = {
    zh: 'LC-ZH',
    en: 'LC-EN',
    ja: 'LC-JA',
  }
  return langMap[lang.toLowerCase()] || 'LC-ZH'
}

/**
 * 博客分类逻辑
 *
 * 数据流理解：
 * 1. posts.json: 定时从API获取的已发布博客快照，用于SSG构建
 * 2. API数据: 实时数据，包含已发布、待发布、草稿
 * 3. 本地草稿: IndexedDB中的草稿，发布后删除改用API数据
 *
 * 分类规则：
 * 1. 已发布: posts.json中的博客（静态快照）
 * 2. 需要更新: API中有对应博客且更新时间比posts.json新
 * 3. API草稿: API中tags包含DRAFT标签的博客
 * 4. 待发布: API中有但posts.json中没有，且不是草稿
 * 5. 语言过滤: 通过tags/label区分不同语言
 */
export function categorizeBlogPosts(
  apiPostsData: ForumAPI.Post[],
  options: BlogCategorizationOptions = {},
): BlogPostCategories {
  const {
    currentLang = 'zh',
    includeDrafts = true,
    includePending = true,
    includeNeedsUpdate = true,
    defaultAvatar = 'https://assets.yuanshen.site/res_ext/avatar/UI_AvatarIcon_71045_Circle.png',
  } = options

  // 获取语言标签用于过滤
  const langLabel = getLanguageLabel(currentLang)

  // 类型断言静态数据
  const staticPosts = posts as ForumAPI.Post[]

  // 按语言过滤静态数据
  const filteredStaticPosts = staticPosts.filter(post =>
    post.tags?.includes(langLabel),
  )

  // 按语言过滤API数据
  const filteredApiPosts = apiPostsData.filter(post =>
    post.tags?.includes(langLabel),
  )

  const published: EnhancedBlogPost[] = []
  const needsUpdate: EnhancedBlogPost[] = []
  const apiDrafts: EnhancedBlogPost[] = []
  const pending: EnhancedBlogPost[] = []

  // 创建API数据映射，用于快速查找
  const apiPostsMap = new Map<string, ForumAPI.Post>()
  filteredApiPosts.forEach((apiPost) => {
    if (apiPost.path) {
      apiPostsMap.set(apiPost.path, apiPost)
    }
  })

  // 处理静态数据（已发布博客的快照）
  filteredStaticPosts.forEach((staticPost) => {
    const baseStaticPost: EnhancedBlogPost = {
      ...staticPost,
      source: 'static' as const,
      // 保持原有的作者信息，添加默认头像
      author: staticPost.author
        ? {
            ...staticPost.author,
            avatar: staticPost.author.avatar || defaultAvatar,
          }
        : {
            id: 'unknown',
            username: 'Unknown',
            login: 'unknown',
            avatar: defaultAvatar,
          },
      contentRaw: staticPost.content?.text || '',
      createdAt: staticPost.createdAt || staticPost.updatedAt,
      updatedAt: staticPost.updatedAt,
      tags: staticPost.tags || [],
    }

    // 检查API中是否有对应的更新版本
    const apiPost = apiPostsMap.get(staticPost.path)

    if (apiPost && includeNeedsUpdate) {
      // 比较更新时间
      const apiUpdateTime = new Date(apiPost.updatedAt).getTime()
      const staticUpdateTime = new Date(staticPost.updatedAt).getTime()

      if (apiUpdateTime > staticUpdateTime) {
        // API数据比静态数据新，需要更新
        const needsUpdatePost: EnhancedBlogPost = {
          ...apiPost,
          source: 'api' as const,
          isOutdated: true, // 标记为过时，需要更新
          staticVersion: baseStaticPost, // 保留静态版本引用
        }
        needsUpdate.push(needsUpdatePost)
      }
      else {
        // 静态数据是最新的
        published.push(baseStaticPost)
      }

      // 从API映射中移除已处理的项目
      apiPostsMap.delete(staticPost.path)
    }
    else {
      // API中没有对应数据，或者不包含需要更新的内容
      published.push(baseStaticPost)
      if (apiPost) {
        apiPostsMap.delete(staticPost.path)
      }
    }
  })

  // 处理剩余的API数据（静态数据中没有的）
  apiPostsMap.forEach((apiPost) => {
    const enhancedApiPost: EnhancedBlogPost = {
      ...apiPost,
      source: 'api' as const,
    }

    // 检查是否是草稿（通过tags/label判断）
    const isDraft = apiPost.tags?.some(tag =>
      tag.toLowerCase().includes('draft'),
    )

    if (isDraft && includeDrafts) {
      // API草稿
      apiDrafts.push(enhancedApiPost)
    }
    else if (!isDraft && includePending) {
      // 待发布内容（API中有但静态数据中没有，且不是草稿）
      const pendingPost: EnhancedBlogPost = {
        ...enhancedApiPost,
        isNew: true, // 标记为新内容
      }
      pending.push(pendingPost)
    }
  })

  return {
    published,
    needsUpdate,
    apiDrafts,
    pending,
  }
}

/**
 * 用于博客选择对话框的专用分类函数
 */
export function useBlogSelectionCategories(
  apiPostsData: ForumAPI.Post[],
  currentLang: string = 'zh',
) {
  const categories = categorizeBlogPosts(apiPostsData, {
    currentLang,
    includeDrafts: true,
    includePending: true,
    includeNeedsUpdate: true,
  })

  return {
    publishedPosts: categories.published,
    // 将API草稿和待发布合并为云端博客
    apiPosts: [...categories.apiDrafts, ...categories.pending],
    needsUpdatePosts: categories.needsUpdate,
  }
}

/**
 * 用于博客主页列表的专用分类函数
 */
export function useBlogHomeCategories(
  apiPostsData: ForumAPI.Post[],
  currentLang: string = 'zh',
  includeManagementPosts: boolean = false,
) {
  const categories = categorizeBlogPosts(apiPostsData, {
    currentLang,
    includeDrafts: includeManagementPosts, // 只有管理员才显示草稿
    includePending: includeManagementPosts, // 只有管理员才显示待发布
    includeNeedsUpdate: includeManagementPosts, // 只有管理员才显示需要更新
  })

  const allPosts: EnhancedBlogPost[] = [
    ...categories.published,
    ...(includeManagementPosts
      ? [
          ...categories.needsUpdate,
          ...categories.pending,
          ...categories.apiDrafts,
        ]
      : []),
  ]

  return {
    allPosts,
    publishedPosts: categories.published,
    needsUpdatePosts: categories.needsUpdate,
    pendingPosts: categories.pending,
    apiDrafts: categories.apiDrafts,
  }
}

/**
 * 获取博客状态信息
 */
export function getBlogPostStatus(post: EnhancedBlogPost): {
  status: 'published' | 'needs-update' | 'draft' | 'pending' | 'local-draft'
  label: string
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
  icon: string
} {
  // 本地草稿
  if (post.source === 'draft') {
    return {
      status: 'local-draft',
      label: '草稿',
      variant: 'secondary',
      icon: 'i-lucide:edit',
    }
  }

  // 已发布（静态数据）
  if (post.source === 'static') {
    return {
      status: 'published',
      label: '已发布',
      variant: 'outline',
      icon: 'i-lucide:check-circle',
    }
  }

  // 需要更新（API版本更新）
  if (post.isOutdated) {
    return {
      status: 'needs-update',
      label: '待更新',
      variant: 'destructive',
      icon: 'i-lucide:refresh-cw',
    }
  }

  // API草稿
  const isDraft = post.tags?.some(tag => tag.toLowerCase().includes('draft'))
  if (isDraft) {
    return {
      status: 'draft',
      label: '草稿',
      variant: 'secondary',
      icon: 'i-lucide:edit',
    }
  }

  // 待发布
  return {
    status: 'pending',
    label: '待发布',
    variant: 'default',
    icon: 'i-lucide:clock',
  }
}
