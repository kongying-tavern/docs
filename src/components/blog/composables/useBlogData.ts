import type { ComputedRef, Ref } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import type { BlogDraft } from '~/services/blogDraftDB'
import { useData } from 'vitepress'
import { useBlogHomeData } from './useBlogComposers'

export interface EnhancedBlogPost extends ForumAPI.Post {
  source: 'static' | 'api' | 'draft'
  isDraft?: boolean
  isProcessing?: boolean
  isOutdated?: boolean
  isNew?: boolean
  lastPublishedAt?: string
  draftData?: BlogDraft
  staticVersion?: EnhancedBlogPost
  // 编辑器特有的操作（可选）
  editorActions?: {
    previewBlog: () => void
    publishBlog: () => Promise<void>
    canPublish: ComputedRef<boolean>
    isPublishing: Ref<boolean>
  }
}

/**
 * 博客数据管理 - 向后兼容的接口
 * 现在使用新的组合器架构，但保持原有的API接口
 *
 * @deprecated 建议直接使用 useBlogHomeData 获得更好的类型支持和性能
 */
export function useBlogData() {
  const { lang } = useData()

  // 使用新的组合器获取数据
  const blogHomeData = useBlogHomeData(lang.value)

  return {
    // 主要数据 - 保持向后兼容
    allPosts: blogHomeData.allPosts,
    isLoading: blogHomeData.isLoading,
    error: blogHomeData.error,

    // 权限
    canManageBlog: blogHomeData.canManageBlog,

    // 操作 - 保持向后兼容的方法名
    refresh: blogHomeData.refresh,
    deleteDraft: blogHomeData.deleteLocalDraft,

    // 新增的细分数据（可选使用）
    publishedPosts: blogHomeData.publishedPosts,
    needsUpdatePosts: blogHomeData.needsUpdatePosts,
    pendingPosts: blogHomeData.pendingPosts,
    apiDrafts: blogHomeData.apiDrafts,
    localDrafts: blogHomeData.localDrafts,

    // 工具方法
    getBlogStatus: blogHomeData.getBlogStatus,
  }
}

// 重新导出类型，保持向后兼容
export type { BlogDraft } from '~/services/blogDraftDB'
