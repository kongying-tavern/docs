import type { BlogDraft } from '~/services/blogDraftDB'
import { defineStore } from 'pinia'
import { computed, readonly, ref } from 'vue'
import { blogDraftDB } from '~/services/blogDraftDB'

export const useBlogDraftStore = defineStore('blogDraft', () => {
  // 状态
  const drafts = ref<BlogDraft[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const recentDrafts = computed(() =>
    drafts.value
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5),
  )

  const draftCount = computed(() => drafts.value.length)

  // 操作
  const fetchDrafts = async (): Promise<void> => {
    if (!import.meta.env || import.meta.env.SSR) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const allDrafts = await blogDraftDB.drafts
        .orderBy('updatedAt')
        .reverse()
        .toArray()

      drafts.value = allDrafts
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '获取草稿失败'
      console.error('获取草稿失败:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  const getDraft = async (id: string): Promise<BlogDraft | null> => {
    try {
      error.value = null
      const draft = await blogDraftDB.drafts.get(id)
      return draft || null
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '获取草稿失败'
      console.error('获取草稿失败:', err)
      return null
    }
  }

  const addDraft = async (draftData: Omit<BlogDraft, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    if (!import.meta.env || import.meta.env.SSR) {
      return null
    }

    try {
      error.value = null
      const now = new Date()
      const draft: Omit<BlogDraft, 'id'> = {
        ...draftData,
        createdAt: now,
        updatedAt: now,
        autoSaveAt: now,
      }

      const id = await blogDraftDB.drafts.add(draft)
      const draftId = String(id)

      // 添加到本地状态
      const newDraft: BlogDraft = { ...draft, id: draftId }
      drafts.value.unshift(newDraft)

      return draftId
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '保存草稿失败'
      console.error('保存草稿失败:', err)
      return null
    }
  }

  const updateDraft = async (id: string, updates: Partial<Omit<BlogDraft, 'id' | 'createdAt'>>): Promise<boolean> => {
    if (!import.meta.env || import.meta.env.SSR) {
      return false
    }

    try {
      error.value = null
      const updateData = {
        ...updates,
        updatedAt: new Date(),
        autoSaveAt: new Date(),
      }

      await blogDraftDB.drafts.update(id, updateData)

      // 更新本地状态
      const index = drafts.value.findIndex(draft => draft.id === id)
      if (index !== -1) {
        drafts.value[index] = { ...drafts.value[index], ...updateData }
      }

      return true
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '更新草稿失败'
      console.error('更新草稿失败:', err)
      return false
    }
  }

  const deleteDraft = async (id: string): Promise<boolean> => {
    if (!import.meta.env || import.meta.env.SSR) {
      return false
    }

    try {
      error.value = null
      await blogDraftDB.drafts.delete(id)

      // 从本地状态移除
      const index = drafts.value.findIndex(draft => draft.id === id)
      if (index !== -1) {
        drafts.value.splice(index, 1)
      }

      return true
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '删除草稿失败'
      console.error('删除草稿失败:', err)
      return false
    }
  }

  const clearAllDrafts = async (): Promise<boolean> => {
    if (!import.meta.env || import.meta.env.SSR) {
      return false
    }

    try {
      error.value = null
      await blogDraftDB.drafts.clear()
      drafts.value = []
      return true
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '清空草稿失败'
      console.error('清空草稿失败:', err)
      return false
    }
  }

  // 自动保存功能
  const autoSave = async (
    draftId: string | null,
    title: string,
    content: string,
    contentJson: string,
    tags: string[] = [],
  ): Promise<string | null> => {
    if (!title.trim() && !content.trim()) {
      return null // 空内容不自动保存
    }

    const draftData = {
      title: title.trim(),
      content: content.trim(),
      contentJson: contentJson.trim(),
      tags,
      autoSaveAt: new Date(),
    }

    if (draftId) {
      const success = await updateDraft(draftId, draftData)
      return success ? draftId : null
    }
    else {
      return await addDraft(draftData)
    }
  }

  // 清理错误状态
  const clearError = () => {
    error.value = null
  }

  return {
    // 状态（只读）
    drafts: readonly(drafts),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // 计算属性
    recentDrafts,
    draftCount,

    // 操作
    fetchDrafts,
    getDraft,
    addDraft,
    updateDraft,
    deleteDraft,
    clearAllDrafts,
    autoSave,
    clearError,
  }
})
