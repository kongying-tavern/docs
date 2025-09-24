import type ForumAPI from '@/apis/forum/api'
import type { BlogDraft } from '~/services/blogDraftDB'
import { onMounted, onUnmounted, ref } from 'vue'
import { getPosts } from '@/apis/forum/gitee/blog'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { blogDraftDB } from '~/services/blogDraftDB'
import { SimpleEventManager } from '~/services/events/SimpleEventManager'
import { useBlogOperations } from './useBlogOperations'

/**
 * 统一的博客数据提供者
 * 负责从API和本地获取原始数据，提供缓存和事件监听
 */
export function useBlogDataProvider() {
  const { canManageBlog } = useBlogOperations()
  const userAuthStore = useUserAuthStore()

  // 数据状态
  const apiPosts = ref<ForumAPI.Post[]>([])
  const localDrafts = ref<BlogDraft[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 检查是否为客户端环境
  const isClient = !import.meta.env.SSR

  /**
   * 获取API博客数据（所有状态）
   * 包括已发布、待发布、草稿等
   */
  const fetchApiPosts = async (): Promise<void> => {
    if (!isClient || !canManageBlog.value || !userAuthStore.isLoggedIn) {
      apiPosts.value = []
      return
    }

    try {
      isLoading.value = true
      error.value = null

      // 并行获取不同状态的博客数据
      const [openResults, draftResults] = await Promise.all([
        // 获取已发布和待发布的博客
        getPosts(
          {
            current: 1,
            pageSize: 100,
            sort: 'updated',
            filter: [],
            creator: '',
          },
          userAuthStore.auth?.accessToken,
        ),
        // 获取草稿状态的博客
        getPosts(
          {
            current: 1,
            pageSize: 50,
            sort: 'updated',
            filter: ['DRAFT'],
            creator: '',
          },
          userAuthStore.auth?.accessToken,
        ).catch(() => ({ data: [] })), // 如果失败则返回空数组
      ])

      // 合并去重
      const allApiPosts = [...(openResults.data || []), ...(draftResults.data || [])]
      const uniquePosts = allApiPosts.reduce((acc, post) => {
        if (!acc.find(p => p.id === post.id)) {
          acc.push(post)
        }
        return acc
      }, [] as ForumAPI.Post[])

      apiPosts.value = uniquePosts
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '获取博客数据失败'
      console.error('获取API博客数据失败:', err)
      apiPosts.value = []
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * 获取本地草稿数据
   */
  const fetchLocalDrafts = async (): Promise<void> => {
    if (!isClient || !canManageBlog.value) {
      localDrafts.value = []
      return
    }

    try {
      const allDrafts = await blogDraftDB.drafts.toArray()
      localDrafts.value = allDrafts.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
    }
    catch (err) {
      console.error('获取本地草稿失败:', err)
      localDrafts.value = []
    }
  }

  /**
   * 刷新所有数据
   */
  const refresh = async (): Promise<void> => {
    await Promise.all([
      fetchApiPosts(),
      fetchLocalDrafts(),
    ])
  }

  /**
   * 删除本地草稿
   */
  const deleteLocalDraft = async (draftId: string): Promise<boolean> => {
    try {
      await blogDraftDB.drafts.delete(draftId)
      await fetchLocalDrafts()
      return true
    }
    catch (err) {
      console.error('删除草稿失败:', err)
      return false
    }
  }

  /**
   * 发布本地草稿后的清理
   * 本地草稿发布后应该删除，改用API数据
   */
  const handleDraftPublished = async (draftId: string): Promise<void> => {
    // 删除本地草稿
    await deleteLocalDraft(draftId)
    // 刷新API数据以获取新发布的内容
    await fetchApiPosts()
  }

  // 事件监听器管理
  const eventManager = SimpleEventManager.getInstance()
  const unsubscribers: Array<() => void> = []

  const handleDraftDeleted = () => {
    if (isClient && canManageBlog.value) {
      fetchLocalDrafts()
    }
  }

  const handleDraftCreated = () => {
    if (isClient && canManageBlog.value) {
      fetchLocalDrafts()
    }
  }

  const handleBlogPublished = () => {
    if (isClient && canManageBlog.value) {
      // 博客发布后，刷新API数据和本地草稿
      // 如果是本地草稿发布，本地草稿会被删除
      fetchApiPosts()
      fetchLocalDrafts()
    }
  }

  const handleBlogDeleted = () => {
    if (isClient && canManageBlog.value) {
      fetchApiPosts()
    }
  }

  // 初始化数据加载
  const initialize = async (): Promise<void> => {
    if (isClient && canManageBlog.value) {
      await refresh()
    }
  }

  // 注册事件监听器
  onMounted(() => {
    // 注册事件监听
    unsubscribers.push(
      eventManager.subscribe('blog:draft-deleted', handleDraftDeleted),
      eventManager.subscribe('blog:draft-created', handleDraftCreated),
      eventManager.subscribe('blog:published', handleBlogPublished),
      eventManager.subscribe('blog:deleted', handleBlogDeleted),
    )

    // 初始化数据
    initialize()
  })

  // 清理事件监听器
  onUnmounted(() => {
    unsubscribers.forEach(unsubscribe => unsubscribe())
    unsubscribers.length = 0
  })

  return {
    // 数据
    apiPosts,
    localDrafts,
    isLoading,
    error,

    // 方法
    fetchApiPosts,
    fetchLocalDrafts,
    refresh,
    deleteLocalDraft,
    handleDraftPublished,
    initialize,

    // 权限
    canManageBlog,
  }
}

/**
 * 单例模式的数据提供者
 * 确保全局只有一个数据提供者实例，避免重复请求
 */
let globalProvider: ReturnType<typeof useBlogDataProvider> | null = null

export function useGlobalBlogDataProvider() {
  if (!globalProvider) {
    globalProvider = useBlogDataProvider()
  }
  return globalProvider
}
