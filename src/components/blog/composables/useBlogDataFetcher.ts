import type ForumAPI from '@/apis/forum/api'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { getPost } from '@/apis/forum/gitee/blog'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { blogDraftDB } from '~/services/blogDraftDB'
import { useBlogOperations } from './useBlogOperations'

export interface BlogEditorData {
  id: string | number
  title: string
  content: string
  contentJson?: string
  tags: string[]
  state: ForumAPI.TopicState
  source: 'draft' | 'api' | 'new'
  createdAt: string
  updatedAt: string
  author?: ForumAPI.User
  isPublished: boolean
}

/**
 * 智能博客数据获取器
 * 根据内容状态自动选择最佳数据源
 */
export function useBlogDataFetcher() {
  const { canManageBlog } = useBlogOperations()
  const userAuthStore = useUserAuthStore()

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const blogData = ref<BlogEditorData | null>(null)

  /**
   * 获取草稿数据（本地优先）
   */
  async function fetchDraftData(draftId: string): Promise<BlogEditorData | null> {
    try {
      const draft = await blogDraftDB.drafts.get(draftId)
      if (draft) {
        return {
          id: draftId,
          title: draft.title,
          content: draft.content,
          contentJson: draft.contentJson,
          tags: draft.tags || [],
          state: 'open',
          source: 'draft',
          createdAt: draft.createdAt.toISOString(),
          updatedAt: draft.updatedAt.toISOString(),
          isPublished: false,
        }
      }
      else {
        const errorMsg = `未找到 ID 为 ${draftId} 的草稿`
        error.value = errorMsg
        toast.error(errorMsg)
        return null
      }
    }
    catch (err) {
      const errorMsg = '获取草稿数据失败'
      error.value = errorMsg
      toast.error(errorMsg)
      return null
    }
  }

  /**
   * 获取已发布内容数据（API优先，确保最新）
   */
  async function fetchPublishedData(blogId: string | number): Promise<BlogEditorData | null> {
    // 使用 useRuleChecks 的权限检查
    if (!canManageBlog.value) {
      const errorMsg = '您没有博客管理权限'
      error.value = errorMsg
      toast.error(errorMsg)
      return null
    }

    if (!userAuthStore.isLoggedIn) {
      const errorMsg = '请先登录'
      error.value = errorMsg
      toast.error(errorMsg)
      return null
    }

    if (!userAuthStore.auth?.accessToken) {
      const errorMsg = '登录令牌无效，请重新登录'
      error.value = errorMsg
      toast.error(errorMsg)
      return null
    }

    try {
      const post = await getPost(blogId, userAuthStore.auth.accessToken)
      if (post) {
        return {
          id: post.id,
          title: post.title,
          content: post.contentRaw,
          contentJson: '',
          tags: post.tags || [],
          state: post.state,
          source: 'api',
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          author: post.author,
          isPublished: post.state === 'open' && !post.tags?.includes('DRAFT'),
        }
      }
      else {
        const errorMsg = `未找到 ID 为 ${blogId} 的博客`
        error.value = errorMsg
        toast.error(errorMsg)
        return null
      }
    }
    catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取博客内容失败'
      error.value = errorMsg
      toast.error(errorMsg)
      return null
    }
  }

  /**
   * 智能数据获取
   * 根据参数类型和状态自动选择最佳数据源
   */
  async function fetchBlogData(params: {
    draftId?: string
    blogId?: string | number
  }): Promise<BlogEditorData | null> {
    const { draftId, blogId } = params

    isLoading.value = true
    error.value = null

    try {
      // 1. 如果是草稿ID，使用本地数据
      if (draftId) {
        return await fetchDraftData(draftId)
      }

      // 2. 如果是博客ID，始终从API获取最新数据
      if (blogId) {
        return await fetchPublishedData(blogId)
      }

      // 3. 新建博客
      return createNewBlogData()
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '获取数据失败'
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * 发布后处理：删除本地草稿并切换到已发布版本
   */
  async function handlePostPublish(draftId: string | null, publishedPost: ForumAPI.Post): Promise<BlogEditorData> {
    try {
      // 删除本地草稿
      if (draftId) {
        await blogDraftDB.drafts.delete(draftId)
      }

      // 返回已发布的数据结构
      return {
        id: publishedPost.id,
        title: publishedPost.title,
        content: publishedPost.contentRaw,
        contentJson: '',
        tags: publishedPost.tags || [],
        state: publishedPost.state,
        source: 'api',
        createdAt: publishedPost.createdAt,
        updatedAt: publishedPost.updatedAt,
        author: publishedPost.author,
        isPublished: true,
      }
    }
    catch (err) {
      console.error('处理发布后清理失败:', err)
      throw err
    }
  }

  /**
   * 创建新博客数据结构
   */
  function createNewBlogData(): BlogEditorData {
    return {
      id: 'new',
      title: '',
      content: '',
      contentJson: '',
      tags: [],
      state: 'open',
      source: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: false,
    }
  }

  return {
    // 状态
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    blogData: computed(() => blogData.value),

    // 方法
    fetchBlogData,
    fetchDraftData,
    fetchPublishedData,
    handlePostPublish,

    // 内部数据（用于响应式更新）
    _setBlogData: (data: BlogEditorData | null) => {
      blogData.value = data
    },
  }
}
