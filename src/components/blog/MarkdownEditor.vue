<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

interface Props {
  modelValue: string
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '开始编写Markdown格式的博客内容...',
})

const emit = defineEmits<Emits>()

const content = ref(props.modelValue)
const textareaRef = ref<HTMLTextAreaElement>()
const isFocused = ref(false)

// 监听外部变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value) {
    content.value = newValue
  }
})

// 发射变化到父组件
watch(content, (newValue) => {
  emit('update:modelValue', newValue)
})

// 简单的Markdown语法高亮
const highlightedContent = computed(() => {
  const highlighted = content.value
    // HTML转义
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    // 标题
    .replace(/^(#{1,6})\s+(.+)$/gm, '<span class="md-heading">$1</span> <span class="md-heading-text">$2</span>')

    // 粗体
    .replace(/\*\*([^*]+)\*\*/g, '<span class="md-strong">**</span><span class="md-strong-text">$1</span><span class="md-strong">**</span>')
    .replace(/__([^_]+)__/g, '<span class="md-strong">__</span><span class="md-strong-text">$1</span><span class="md-strong">__</span>')

    // 斜体
    .replace(/\*([^*]+)\*/g, '<span class="md-em">*</span><span class="md-em-text">$1</span><span class="md-em">*</span>')
    .replace(/_([^_]+)_/g, '<span class="md-em">_</span><span class="md-em-text">$1</span><span class="md-em">_</span>')

    // 行内代码
    .replace(/`([^`]+)`/g, '<span class="md-code">`</span><span class="md-code-text">$1</span><span class="md-code">`</span>')

    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="md-link">[</span><span class="md-link-text">$1</span><span class="md-link">](</span><span class="md-url">$2</span><span class="md-link">)</span>')

    // 图片
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<span class="md-image">![</span><span class="md-alt">$1</span><span class="md-image">](</span><span class="md-url">$2</span><span class="md-image">)</span>')

    // 列表
    .replace(/^(\s*)([-*+])\s+(.+)$/gm, '$1<span class="md-list">$2</span> $3')
    .replace(/^(\s*)(\d+\.)\s+(.+)$/gm, '$1<span class="md-list">$2</span> $3')

    // 引用
    .replace(/^>\s*(.+)$/gm, '<span class="md-quote">&gt;</span> <span class="md-quote-text">$1</span>')

    // 代码块
    .replace(/^```(\w*)\n([\s\S]*?)^```$/gm, '<span class="md-code-block">```$1</span>\n<span class="md-code-block-content">$2</span><span class="md-code-block">```</span>')

    // 分割线
    .replace(/^(-{3,}|={3,}|\*{3,})$/gm, '<span class="md-hr">$1</span>')

  // 添加换行
  return highlighted.replace(/\n/g, '<br>')
})

function handleInput() {
  nextTick(() => {
    syncScroll()
  })
}

function syncScroll() {
  if (textareaRef.value) {
    const highlightLayer = textareaRef.value.parentElement?.querySelector('.syntax-highlight-layer') as HTMLElement
    if (highlightLayer) {
      highlightLayer.scrollTop = textareaRef.value.scrollTop
      highlightLayer.scrollLeft = textareaRef.value.scrollLeft
    }
  }
}

// 增强编辑体验的快捷键
function handleKeydown(e: KeyboardEvent) {
  const textarea = textareaRef.value
  if (!textarea)
    return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = content.value

  // Tab键：插入两个空格
  if (e.key === 'Tab') {
    e.preventDefault()
    content.value = `${value.substring(0, start)}  ${value.substring(end)}`
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2
    })
  }

  // Ctrl/Cmd + B：加粗
  else if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault()
    const selectedText = value.substring(start, end)
    const replacement = selectedText ? `**${selectedText}**` : '**粗体文本**'
    content.value = value.substring(0, start) + replacement + value.substring(end)
    nextTick(() => {
      if (selectedText) {
        textarea.selectionStart = start + 2
        textarea.selectionEnd = start + 2 + selectedText.length
      }
      else {
        textarea.selectionStart = start + 2
        textarea.selectionEnd = start + 6
      }
    })
  }

  // Ctrl/Cmd + I：斜体
  else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
    e.preventDefault()
    const selectedText = value.substring(start, end)
    const replacement = selectedText ? `*${selectedText}*` : '*斜体文本*'
    content.value = value.substring(0, start) + replacement + value.substring(end)
    nextTick(() => {
      if (selectedText) {
        textarea.selectionStart = start + 1
        textarea.selectionEnd = start + 1 + selectedText.length
      }
      else {
        textarea.selectionStart = start + 1
        textarea.selectionEnd = start + 5
      }
    })
  }

  // Ctrl/Cmd + K：链接
  else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    const selectedText = value.substring(start, end)
    const replacement = selectedText ? `[${selectedText}](url)` : '[链接文本](url)'
    content.value = value.substring(0, start) + replacement + value.substring(end)
    nextTick(() => {
      const urlStart = start + replacement.indexOf('(') + 1
      const urlEnd = urlStart + 3
      textarea.selectionStart = urlStart
      textarea.selectionEnd = urlEnd
    })
  }

  // Enter键：自动列表延续
  else if (e.key === 'Enter') {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const currentLine = value.substring(lineStart, start)
    const listMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s/)

    if (listMatch) {
      e.preventDefault()
      const indent = listMatch[1]
      const marker = listMatch[2]
      const nextMarker = marker.match(/\d+/) ? `${Number.parseInt(marker) + 1}.` : marker
      const newLine = `\n${indent}${nextMarker} `

      content.value = value.substring(0, start) + newLine + value.substring(end)
      nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + newLine.length
      })
    }
  }
}
</script>

<template>
  <div class="markdown-editor">
    <!-- 语法高亮显示层 -->
    <div
      class="syntax-highlight-layer"
      :class="{ 'is-focused': isFocused }"
      v-html="highlightedContent"
    />

    <!-- 透明的文本输入层 -->
    <textarea
      ref="textareaRef"
      v-model="content"
      :placeholder="placeholder"
      class="markdown-textarea"
      @input="handleInput"
      @focus="isFocused = true"
      @blur="isFocused = false"
      @scroll="syncScroll"
      @keydown="handleKeydown"
    />
  </div>
</template>

<style scoped>
.markdown-editor {
  position: relative;
  width: 100%;
  min-height: 400px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg);
}

.syntax-highlight-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1rem;
  overflow: auto;
  pointer-events: none;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: transparent;
  line-height: 1.6;
  font-size: 14px;
  z-index: 1;
}

.markdown-textarea {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  padding: 1rem;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--vp-c-text-1);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  z-index: 2;
  caret-color: var(--vp-c-text-1);
}

.markdown-textarea::placeholder {
  color: var(--vp-c-text-3);
  font-style: italic;
}

.markdown-textarea:focus {
  outline: none;
}

.markdown-editor:focus-within {
  border-color: var(--vp-c-brand);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

/* Markdown语法高亮样式 - 优化VitePress主题适配 */
.syntax-highlight-layer :deep(.md-heading) {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.syntax-highlight-layer :deep(.md-heading-text) {
  color: var(--vp-c-text-1);
  font-weight: 600;
  font-size: inherit;
}

.syntax-highlight-layer :deep(.md-strong) {
  color: var(--vp-c-brand-2);
  opacity: 0.8;
}

.syntax-highlight-layer :deep(.md-strong-text) {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.syntax-highlight-layer :deep(.md-em) {
  color: var(--vp-c-brand-2);
  opacity: 0.8;
}

.syntax-highlight-layer :deep(.md-em-text) {
  color: var(--vp-c-text-1);
  font-style: italic;
}

.syntax-highlight-layer :deep(.md-code) {
  color: var(--vp-c-brand-2);
  opacity: 0.7;
}

.syntax-highlight-layer :deep(.md-code-text) {
  color: var(--vp-code-color);
  background: var(--vp-code-bg);
  padding: 0.125em 0.375em;
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
  font-size: 0.9em;
}

.syntax-highlight-layer :deep(.md-link) {
  color: var(--vp-c-brand-2);
  opacity: 0.7;
}

.syntax-highlight-layer :deep(.md-link-text) {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
  text-decoration-color: var(--vp-c-brand-3);
}

.syntax-highlight-layer :deep(.md-url) {
  color: var(--vp-c-brand-2);
  opacity: 0.8;
}

.syntax-highlight-layer :deep(.md-image) {
  color: var(--vp-c-brand-2);
  opacity: 0.7;
}

.syntax-highlight-layer :deep(.md-alt) {
  color: var(--vp-c-text-2);
  font-style: italic;
}

.syntax-highlight-layer :deep(.md-list) {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.syntax-highlight-layer :deep(.md-quote) {
  color: var(--vp-c-brand-2);
  opacity: 0.8;
}

.syntax-highlight-layer :deep(.md-quote-text) {
  color: var(--vp-c-text-2);
  font-style: italic;
  border-left: 3px solid var(--vp-c-brand-3);
  padding-left: 0.75em;
  background: var(--vp-c-bg-soft);
}

.syntax-highlight-layer :deep(.md-code-block) {
  color: var(--vp-c-brand-2);
  opacity: 0.7;
}

.syntax-highlight-layer :deep(.md-code-block-content) {
  color: var(--vp-code-color);
  background: var(--vp-code-bg);
  display: block;
  padding: 0.75em 1em;
  border-radius: 6px;
  margin: 0.5em 0;
  font-family: var(--vp-font-family-mono);
  font-size: 0.9em;
  border: 1px solid var(--vp-c-divider-light);
}

.syntax-highlight-layer :deep(.md-hr) {
  color: var(--vp-c-divider);
  font-weight: 600;
  text-align: center;
}
</style>
