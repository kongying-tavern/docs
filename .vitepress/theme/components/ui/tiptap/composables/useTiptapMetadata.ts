import type { Editor } from '@tiptap/vue-3'
import type { ComputedRef } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

export interface TiptapMetadata {
  lastSaved: Date | null
  wordCount: number
  charCount: number
  readingTime: string
}

export function useTiptapMetadata(editor: ComputedRef<Editor | undefined>) {
  const metadata = ref<TiptapMetadata>({
    lastSaved: null,
    wordCount: 0,
    charCount: 0,
    readingTime: '0 min',
  })

  // 元数据更新防抖处理
  const debouncedUpdateMetadata = useDebounceFn(() => {
    updateMetadata()
  }, 300)

  function updateMetadata() {
    if (!editor.value) {
      return
    }

    // TipTap 3: 优先使用 CharacterCount 扩展以提高性能
    const characterCountExtension = editor.value.storage.characterCount
    if (characterCountExtension) {
      metadata.value.charCount = characterCountExtension.characters() || 0
      metadata.value.wordCount = characterCountExtension.words() || 0
    }
    else {
      // 后备方案：直接计算（性能较低）
      const text = editor.value.state.doc.textContent
      metadata.value.charCount = text.length
      metadata.value.wordCount = text.split(/\s+/).filter(word => word.length > 0).length
    }

    // 计算阅读时间 (平均阅读速度: 200 words per minute)
    const minutes = Math.max(1, Math.round(metadata.value.wordCount / 200))
    metadata.value.readingTime = `${minutes} min read`
  }

  function markAsSaved() {
    metadata.value.lastSaved = new Date()
  }

  // 监听编辑器变化
  watch(() => editor.value, (newEditor) => {
    if (newEditor) {
      updateMetadata()

      // 监听编辑器内容变化 - 使用 transaction 更准确
      newEditor.on('transaction', ({ transaction }) => {
        // 只有在文档内容真正改变时才更新元数据
        if (transaction.docChanged) {
          debouncedUpdateMetadata()
        }
      })
    }
  }, { immediate: true })

  return {
    metadata: computed(() => metadata.value),
    updateMetadata,
    markAsSaved,
  }
}
