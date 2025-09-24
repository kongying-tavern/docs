<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import type { HTMLAttributes } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useTiptapContext } from '.'

const props = defineProps<{
  editor?: Editor | null
  class?: HTMLAttributes['class']
  showWordCount?: boolean
  showCharCount?: boolean
  showSelection?: boolean
}>()

// Get editor from context if not provided directly
const { editor: contextEditor } = useTiptapContext()
const editor = computed(() => props.editor ?? contextEditor.value)

// Editor is ready when it's available and initialized
const isEditorReady = computed(() => {
  return editor.value && editor.value.isEditable
})

// Calculate word and character count
const wordCount = ref(0)
const charCount = ref(0)
const selection = ref({ from: 0, to: 0, text: '' })

// TipTap 3: 优化的计数更新，使用 CharacterCount 扩展和防抖
function updateCounts() {
  if (!isEditorReady.value)
    return

  // TipTap 3: 优先使用 CharacterCount 扩展以提高性能
  const characterCountExtension = editor.value!.storage.characterCount
  if (characterCountExtension) {
    charCount.value = characterCountExtension.characters() || 0
    wordCount.value = characterCountExtension.words() || 0
  }
  else {
    // 后备方案：直接计算
    const text = editor.value!.state.doc.textContent
    charCount.value = text.length
    wordCount.value = text.split(/\s+/).filter(word => word.length > 0).length
  }

  // Get selection info
  const { from, to } = editor.value!.state.selection
  selection.value = {
    from,
    to,
    text: editor.value!.state.doc.textBetween(from, to, ' '),
  }
}

// TipTap 3: 防抖更新以减少频繁计算
const debouncedUpdateCounts = useDebounceFn(updateCounts, 150)

// Watch for editor changes and update counts
watch(() => editor.value, (newEditor) => {
  if (newEditor) {
    updateCounts()

    // TipTap 3: 使用 transaction 监听器但加入防抖优化
    newEditor.on('transaction', ({ transaction }) => {
      // 只有在文档内容真正改变时才更新计数
      if (transaction.docChanged) {
        debouncedUpdateCounts()
      }

      // 选择变化时立即更新（因为用户需要看到选择信息）
      if (transaction.selectionSet) {
        const { from, to } = transaction.selection
        selection.value = {
          from,
          to,
          text: newEditor.state.doc.textBetween(from, to, ' '),
        }
      }
    })
  }
}, { immediate: true })
</script>

<template>
  <div
    :class="cn(
      'tiptap-status-bar flex items-center justify-between px-3 py-1 text-xs',
      props.class,
    )"
    data-slot="tiptap-status-bar"
  >
    <!-- Document stats -->
    <div class="flex items-center gap-3">
      <span v-if="props.showWordCount" class="text-muted-foreground">
        {{ wordCount }} words
      </span>
      <span v-if="props.showCharCount" class="text-muted-foreground">
        {{ charCount }} characters
      </span>
    </div>

    <!-- Selection info -->
    <div v-if="props.showSelection && selection.from !== selection.to" class="text-muted-foreground">
      {{ selection.to - selection.from }} characters selected
    </div>

    <!-- Editor mode -->
    <div class="flex items-center gap-2">
      <Badge v-if="isEditorReady" variant="outline">
        {{ editor?.isEditable ? 'Editing' : 'Reading' }}
      </Badge>
    </div>
  </div>
</template>
