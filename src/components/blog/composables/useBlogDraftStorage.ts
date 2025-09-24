import type { BlogDraft } from '~/services/blogDraftDB'
import { useDebounceFn } from '@vueuse/core'
import { ref } from 'vue'
import { blogDraftDB } from '~/services/blogDraftDB'

export function useBlogDraftStorage() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const saveDraft = async (draft: Omit<BlogDraft, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    try {
      isLoading.value = true
      error.value = null

      const now = new Date()
      const draftToSave: Omit<BlogDraft, 'id'> = {
        ...draft,
        createdAt: now,
        updatedAt: now,
        autoSaveAt: now,
      }

      const id = await blogDraftDB.drafts.add(draftToSave)
      return String(id)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '保存草稿失败'
      console.error('保存草稿失败:', err)
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  const updateDraft = async (id: string, updates: Partial<Omit<BlogDraft, 'id' | 'createdAt'>>): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      const updateData = {
        ...updates,
        updatedAt: new Date(),
        autoSaveAt: new Date(),
      }

      await blogDraftDB.drafts.update(id, updateData)
      return true
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '更新草稿失败'
      console.error('更新草稿失败:', err)
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  const getDrafts = async (): Promise<BlogDraft[]> => {
    try {
      isLoading.value = true
      error.value = null

      const drafts = await blogDraftDB.drafts
        .orderBy('updatedAt')
        .reverse()
        .toArray()

      return drafts
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '获取草稿列表失败'
      console.error('获取草稿列表失败:', err)
      return []
    }
    finally {
      isLoading.value = false
    }
  }

  const getDraft = async (id: string): Promise<BlogDraft | null> => {
    try {
      isLoading.value = true
      error.value = null

      const draft = await blogDraftDB.drafts.get(id)
      return draft || null
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '获取草稿失败'
      console.error('获取草稿失败:', err)
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  const deleteDraft = async (id: string): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      await blogDraftDB.drafts.delete(id)
      return true
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '删除草稿失败'
      console.error('删除草稿失败:', err)
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  const clearAllDrafts = async (): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      await blogDraftDB.drafts.clear()
      return true
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '清空草稿失败'
      console.error('清空草稿失败:', err)
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  // 自动保存功能，2秒防抖
  const autoSave = useDebounceFn(async (
    draftId: string | null,
    title: string,
    content: string,
    contentJson: string,
    tags: string[] = [],
  ) => {
    if (!title.trim() && !content.trim()) {
      return // 空内容不自动保存
    }

    const now = new Date()
    const draftData = {
      title: title.trim(),
      content: content.trim(),
      contentJson: contentJson.trim(),
      tags,
      autoSaveAt: now,
    }

    if (draftId) {
      await updateDraft(draftId, draftData)
    }
    else {
      await saveDraft(draftData)
    }
  }, 2000)

  return {
    // 状态
    isLoading,
    error,

    // 操作方法
    saveDraft,
    updateDraft,
    getDrafts,
    getDraft,
    deleteDraft,
    clearAllDrafts,
    autoSave,
  }
}
