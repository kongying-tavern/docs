import type { BlogDraft, EnhancedBlogPost } from './useBlogData'
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { useGlobalBlogDataProvider } from './useBlogDataProvider'
import { getBlogPostStatus, useBlogHomeCategories, useBlogSelectionCategories } from './useBlogPostCategories'

/**
 * 转换本地草稿为博客格式
 */
function draftToBlogPost(draft: BlogDraft): EnhancedBlogPost {
  return {
    id: `draft-${draft.id}`,
    title: draft.title || '无标题草稿',
    content: {
      text: draft.content,
    },
    contentRaw: draft.content,
    link: '',
    tags: draft.tags,
    commentCount: 0,
    user: {
      id: 'local',
      login: 'local-draft',
      username: '本地草稿',
      avatar: '',
    },
    state: 'open' as ForumAPI.TopicState,
    type: 'POST' as ForumAPI.TopicType,
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
    author: {
      id: 'local',
      login: 'local-draft',
      username: '本地草稿',
      avatar: '',
    },
    path: '',
    source: 'draft',
    isDraft: true,
    draftData: draft,
  }
}

/**
 * 博客主页数据组合器
 * 提供主页展示所需的博客数据，包含语言过滤和权限控制
 */
export function useBlogHomeData(currentLang: string = 'zh') {
  const provider = useGlobalBlogDataProvider()

  // 分类API数据
  const categorized = computed(() =>
    useBlogHomeCategories(
      provider.apiPosts.value,
      currentLang,
      provider.canManageBlog.value, // 只有管理员看到管理类内容
    ),
  )

  // 合并所有博客数据
  const allPosts = computed(() => {
    const result: EnhancedBlogPost[] = [...categorized.value.allPosts]

    // 如果有管理权限，添加本地草稿
    if (provider.canManageBlog.value) {
      const draftPosts = provider.localDrafts.value.map(draftToBlogPost)
      result.push(...draftPosts)
    }

    // 按类型和时间排序
    return result.sort((a, b) => {
      // 本地草稿和未发布博客按编辑时间排序
      if ((a.source === 'draft' || a.isDraft || a.isProcessing)
        && (b.source === 'draft' || b.isDraft || b.isProcessing)) {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }

      // 已发布博客按发布时间排序
      if (a.source === 'static' && b.source === 'static') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }

      // 混合排序：草稿优先，然后按时间
      if ((a.source === 'draft' || a.isDraft || a.isProcessing)
        && !(b.source === 'draft' || b.isDraft || b.isProcessing)) {
        return -1
      }
      if (!(a.source === 'draft' || a.isDraft || a.isProcessing)
        && (b.source === 'draft' || b.isDraft || b.isProcessing)) {
        return 1
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  })

  // 获取博客状态信息
  const getBlogStatus = (post: EnhancedBlogPost) => getBlogPostStatus(post)

  return {
    // 数据
    allPosts,
    publishedPosts: categorized.value.publishedPosts,
    needsUpdatePosts: categorized.value.needsUpdatePosts,
    pendingPosts: categorized.value.pendingPosts,
    apiDrafts: categorized.value.apiDrafts,
    localDrafts: provider.localDrafts,

    // 状态
    isLoading: provider.isLoading,
    error: provider.error,
    canManageBlog: provider.canManageBlog,

    // 操作
    refresh: provider.refresh,
    deleteLocalDraft: provider.deleteLocalDraft,
    handleDraftPublished: provider.handleDraftPublished,

    // 工具函数
    getBlogStatus,
  }
}

/**
 * 博客选择对话框数据组合器
 * 提供选择对话框所需的博客数据，包含所有状态的博客
 */
export function useBlogSelectionData(currentLang: string = 'zh') {
  const provider = useGlobalBlogDataProvider()

  // 分类API数据
  const categorized = computed(() =>
    useBlogSelectionCategories(provider.apiPosts.value, currentLang),
  )

  return {
    // 已发布博客
    publishedPosts: categorized.value.publishedPosts,

    // 云端博客（API草稿 + 待发布）
    apiPosts: categorized.value.apiPosts,

    // 需要更新的博客
    needsUpdatePosts: categorized.value.needsUpdatePosts,

    // 本地草稿
    localDrafts: provider.localDrafts,

    // 状态
    isLoading: provider.isLoading,
    error: provider.error,
    canManageBlog: provider.canManageBlog,

    // 操作
    refresh: provider.refresh,
    deleteLocalDraft: provider.deleteLocalDraft,
  }
}

/**
 * 博客管理数据组合器
 * 提供管理员页面所需的全面博客数据
 */
export function useBlogManagementData(currentLang: string = 'zh') {
  const provider = useGlobalBlogDataProvider()

  // 获取所有分类的博客数据
  const categorized = computed(() =>
    useBlogHomeCategories(
      provider.apiPosts.value,
      currentLang,
      true, // 管理员看到所有内容
    ),
  )

  // 统计信息
  const stats = computed(() => ({
    total: categorized.value.allPosts.length + provider.localDrafts.value.length,
    published: categorized.value.publishedPosts.length,
    needsUpdate: categorized.value.needsUpdatePosts.length,
    pending: categorized.value.pendingPosts.length,
    apiDrafts: categorized.value.apiDrafts.length,
    localDrafts: provider.localDrafts.value.length,
  }))

  return {
    // 分类数据
    publishedPosts: categorized.value.publishedPosts,
    needsUpdatePosts: categorized.value.needsUpdatePosts,
    pendingPosts: categorized.value.pendingPosts,
    apiDrafts: categorized.value.apiDrafts,
    localDrafts: provider.localDrafts,

    // 统计信息
    stats,

    // 状态
    isLoading: provider.isLoading,
    error: provider.error,
    canManageBlog: provider.canManageBlog,

    // 操作
    refresh: provider.refresh,
    deleteLocalDraft: provider.deleteLocalDraft,
    handleDraftPublished: provider.handleDraftPublished,
  }
}
