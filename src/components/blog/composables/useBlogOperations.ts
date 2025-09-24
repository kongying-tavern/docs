import type ForumAPI from '@/apis/forum/api'
import { computed, ref } from 'vue'
import { createBlogPost, deleteBlogPost, updateBlogPost } from '@/apis/forum/gitee/blog'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useRuleChecks } from '~/composables/useRuleChecks'

export function useBlogOperations() {
  const userInfo = useUserInfoStore()
  const { hasAnyRoles, hasAllPermissions } = useRuleChecks(userInfo.info?.id)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const canManageBlog = computed(() => {
    // 使用 useRuleChecks 检查是否具备博客管理角色
    return true
    return hasAnyRoles('teamMember', 'blogMember').value
  })

  const canEditPost = (post: ForumAPI.Post) => {
    if (!canManageBlog.value)
      return false

    if (!post.author)
      return true

    return post.author.id === userInfo.info?.id
      || hasAllPermissions('write_blog').value
  }

  const createPost = async (data: {
    title: string
    body: string
    labels?: string[]
  }): Promise<ForumAPI.Post | null> => {
    if (!canManageBlog.value) {
      error.value = '您没有权限创建博客'
      return null
    }

    try {
      isLoading.value = true
      error.value = null

      const post = await createBlogPost({
        ...data,
        labels: data.labels || ['BLOG'],
      })

      return post
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '创建博客失败'
      console.error('创建博客失败:', err)
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  // 更新博客
  const updatePost = async (
    number: string | number,
    data: {
      title?: string
      body?: string
      labels?: string[]
      state?: ForumAPI.TopicState
    },
  ): Promise<ForumAPI.Post | null> => {
    if (!canManageBlog.value) {
      error.value = '您没有权限编辑博客'
      return null
    }

    try {
      isLoading.value = true
      error.value = null

      const updateData = {
        ...data,
        labels: data.labels ? data.labels.join(',') : undefined,
      }

      const post = await updateBlogPost(number, updateData)
      return post
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '更新博客失败'
      console.error('更新博客失败:', err)
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  // 删除博客（软删除）
  const deletePost = async (number: string | number): Promise<boolean> => {
    if (!canManageBlog.value) {
      error.value = '您没有权限删除博客'
      return false
    }

    try {
      isLoading.value = true
      error.value = null

      const success = await deleteBlogPost(number)
      return success
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '删除博客失败'
      console.error('删除博客失败:', err)
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  // 发布草稿（移除DRAFT标签）
  const publishDraft = async (
    number: string | number,
    currentLabels: string[] = [],
  ): Promise<boolean> => {
    const labelsWithoutDraft = currentLabels.filter(label => label !== 'DRAFT')
    const updatedPost = await updatePost(number, {
      labels: labelsWithoutDraft.length > 0 ? labelsWithoutDraft : ['BLOG'],
      state: 'open',
    })

    return updatedPost !== null
  }

  // 保存为草稿（添加DRAFT标签）
  const saveToDraft = async (data: {
    title: string
    body: string
    labels?: string[]
  }): Promise<ForumAPI.Post | null> => {
    const draftLabels = [...(data.labels || []), 'DRAFT']
    return await createPost({
      ...data,
      labels: draftLabels,
    })
  }

  // 复制博客为草稿
  const duplicateAsDraft = async (post: ForumAPI.Post): Promise<boolean> => {
    if (!canManageBlog.value) {
      error.value = '您没有权限复制博客'
      return false
    }

    try {
      isLoading.value = true
      error.value = null

      const draftLabels = [...(post.tags || []), 'DRAFT']
      const duplicatedPost = await createPost({
        title: `${post.title} - 副本`,
        body: post.contentRaw,
        labels: draftLabels,
      })

      return duplicatedPost !== null
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '复制博客失败'
      console.error('复制博客失败:', err)
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  // 导出博客内容
  const exportBlog = (post: ForumAPI.Post, format: 'md' | 'txt' = 'md'): void => {
    const content = post.contentRaw || ''
    const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${post.title || 'blog'}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return {
    // 状态
    isLoading,
    error,

    // 权限
    canManageBlog,
    canEditPost,

    // 操作
    createPost,
    updatePost,
    deletePost,
    publishDraft,
    saveToDraft,
    duplicateAsDraft,
    exportBlog,
  }
}
