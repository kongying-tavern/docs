<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import type { HTMLAttributes } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { computed, onMounted, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { useTiptapContext } from '.'

const props = defineProps<{
  editor?: Editor | null
  class?: HTMLAttributes['class']
  placeholder?: string
  notionStyle?: boolean
}>()

// Get editor from context if not provided directly
const { editor: contextEditor } = useTiptapContext()
const editor = computed(() => props.editor ?? contextEditor.value)

// Editor is ready when it's available and initialized
const isEditorReady = computed(() => {
  return editor.value && editor.value.isEditable
})

// Reference to the editor element
const editorElement = ref<HTMLElement | null>(null)

// Optimized DOM mounting with performance considerations for TipTap 3
const mountEditor = useDebounceFn(() => {
  const currentEditor = editor.value
  const element = editorElement.value

  if (currentEditor && element && !element.firstChild) {
    // Use requestAnimationFrame for better performance in TipTap 3
    requestAnimationFrame(() => {
      // TipTap 3: More efficient DOM mounting
      const editorDOM = currentEditor.view.dom

      // Add performance optimizations for TipTap 3
      if (editorDOM) {
        // Batch DOM operations for better performance
        element.style.contain = 'layout style paint'
        element.append(editorDOM)

        // TipTap 3: Add performance hints
        editorDOM.setAttribute('data-tiptap-version', '3')
      }
    })
  }
}, 50)

// Mount editor to DOM when editor is available or element changes
watch([editor, editorElement], mountEditor, { immediate: true })

// TipTap 3 优化的DOM挂载
onMounted(() => {
  if (isEditorReady.value && editorElement.value && !editorElement.value.firstChild) {
    // TipTap 3: Enhanced DOM mounting with performance optimizations
    const element = editorElement.value
    const editorDOM = editor.value!.view.dom

    // Add CSS containment for better performance
    element.style.contain = 'layout style paint'
    element.append(editorDOM)
  }

  if (isEditorReady.value && editorElement.value && editorElement.value.firstChild) {
    // Add appropriate ARIA attributes with TipTap 3 enhancements
    const editorDOM = editorElement.value.firstChild as HTMLElement

    // Enhanced accessibility for TipTap 3
    editorDOM.setAttribute('role', 'textbox')
    editorDOM.setAttribute('aria-multiline', 'true')
    editorDOM.setAttribute('aria-label', 'Rich text editor')
    editorDOM.setAttribute('data-tiptap-version', '3')

    // TipTap 3: Add performance hints
    editorDOM.style.contain = 'layout style'
  }
})
</script>

<template>
  <div
    :class="cn(
      'tiptap-editor-wrapper relative',
      props.class,
    )"
    data-slot="tiptap-content"
    data-tiptap-version="3"
    aria-label="Rich text editor"
    style="contain: layout style"
  >
    <div
      v-if="isEditorReady"
      ref="editorElement"
      :class="cn(
        'h-full w-full focus:outline-none',
        props.notionStyle
          ? 'notion-editor-content px-0 py-4'
          : 'max-w-none px-4 py-0 prose sm:prose dark:prose-invert',
      )"
      role="region"
    />

    <div
      v-else
      class="tiptap-editor-placeholder h-full w-full flex items-center justify-center text-sm text-muted-foreground italic"
      aria-live="polite"
    >
      {{ placeholder || 'Loading editor...' }}
    </div>
  </div>
</template>

<style>
/* TipTap 3 Editor styles with performance optimizations */
.tiptap-editor-wrapper .ProseMirror {
  min-height: 100px;
  height: 100%;
  border: none;
  outline: none;
  /* TipTap 3: CSS containment for better performance */
  contain: layout style;
  /* TipTap 3: Hardware acceleration hints */
  will-change: auto;
  /* TipTap 3: Optimize text rendering */
  text-rendering: optimizeSpeed;
}

/* Notion-style editor content */
.notion-editor-content .ProseMirror {
  @apply text-base leading-relaxed min-h-[500px];

  /* 块级元素基础样式 */
  .notion-block {
    @apply relative py-1 mx-0 rounded-sm;
    @apply transition-colors duration-150;
    @apply hover:bg-gray-50/50 dark:hover:bg-gray-800/50;
    @apply group;

    /* 悬停时显示拖拽手柄区域 */
    &::before {
      content: '⋮⋮';
      @apply absolute left-0 top-1/2 -translate-y-1/2;
      @apply w-6 h-4 flex items-center justify-center;
      @apply opacity-0 group-hover:opacity-100;
      @apply transition-opacity duration-150;
      @apply text-gray-400 dark:text-gray-500;
      @apply cursor-grab text-xs leading-none;
      @apply rotate-90;
    }
  }

  /* 段落样式 */
  p {
    @apply py-1 leading-relaxed min-h-[1.5em];
    @apply notion-block;
  }

  /* 标题样式 */
  h1, h2, h3 {
    @apply notion-block font-semibold mt-4 mb-2;
  }

  h1 {
    @apply text-3xl font-bold mt-6 mb-3;
  }

  h2 {
    @apply text-2xl font-semibold mt-5 mb-2;
  }

  h3 {
    @apply text-xl font-medium mt-4 mb-1;
  }

  /* 引用样式 */
  blockquote {
    @apply notion-block;
    @apply border-l-4 border-blue-400 dark:border-blue-500;
    @apply pl-4 py-2 my-2;
    @apply bg-blue-50/30 dark:bg-blue-900/20;
    @apply italic text-gray-700 dark:text-gray-300;
  }

  /* 列表样式 */
  ul, ol {
    @apply my-1;

    li {
      @apply notion-block py-0.5;
      @apply marker:text-gray-500 dark:marker:text-gray-400;
    }
  }

  /* 任务列表样式 */
  ul[data-type="taskList"] {
    @apply list-none my-1;

    li[data-type="taskItem"] {
      @apply notion-block flex items-start gap-2 py-0.5;

      label {
        @apply flex items-center gap-2 cursor-pointer;
        @apply hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1;

        input[type="checkbox"] {
          @apply w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600;
          @apply checked:bg-blue-500 checked:border-blue-500;
          @apply focus:ring-2 focus:ring-blue-200 focus:ring-offset-0;
        }
      }
    }
  }

  /* 代码块样式 */
  pre {
    @apply notion-block bg-gray-100 dark:bg-gray-800;
    @apply border border-gray-200 dark:border-gray-700;
    @apply rounded-lg p-4 my-2;
    @apply font-mono text-sm overflow-x-auto;

    code {
      @apply bg-transparent p-0;
    }
  }

  /* 内联代码样式 */
  code {
    @apply bg-gray-100 dark:bg-gray-800;
    @apply px-1.5 py-0.5 rounded text-sm;
    @apply font-mono;
  }

  /* 分割线样式 */
  hr {
    @apply notion-block border-t border-gray-300 dark:border-gray-600;
    @apply my-6 mx-0;
  }

  /* 图片样式 */
  img {
    @apply notion-block my-2 rounded-lg;
    @apply max-w-full h-auto;
    @apply shadow-sm border border-gray-200 dark:border-gray-700;
  }

  /* 表格样式 */
  table {
    @apply notion-block w-full border-collapse my-4;
    @apply border border-gray-200 dark:border-gray-700 rounded-lg;
    @apply overflow-hidden;

    th, td {
      @apply border border-gray-200 dark:border-gray-700;
      @apply px-3 py-2 text-left;
    }

    th {
      @apply bg-gray-50 dark:bg-gray-800;
      @apply font-medium text-gray-900 dark:text-gray-100;
    }

    td {
      @apply bg-white dark:bg-gray-900;
    }
  }
}

.tiptap-editor-wrapper .ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

/* Component styles */
.tiptap-editor-wrapper .component-node {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.tiptap-editor-wrapper .component-selected {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Heading styles */
.tiptap-editor-wrapper h1 {
  font-size: 2em;
  margin-top: 0.67em;
  margin-bottom: 0.67em;
}

.tiptap-editor-wrapper h2 {
  font-size: 1.5em;
  margin-top: 0.83em;
  margin-bottom: 0.83em;
}

.tiptap-editor-wrapper h3 {
  font-size: 1.17em;
  margin-top: 1em;
  margin-bottom: 1em;
}

/* Node selection styles */
.tiptap-editor-wrapper .ProseMirror .is-node-selected {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Placeholder for empty nodes */
.tiptap-editor-wrapper .ProseMirror p.is-empty::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

/* Focus indicators for accessibility */
.tiptap-editor-wrapper .ProseMirror:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

/* Better focus styles for interactive elements */
.tiptap-editor-wrapper .ProseMirror *[data-interactive]:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

/* High contrast mode support */
@media (forced-colors: active) {
  .tiptap-editor-wrapper .ProseMirror:focus-visible {
    outline: 3px solid CanvasText;
  }

  .tiptap-editor-wrapper .component-selected {
    outline: 3px solid Highlight;
  }
}
</style>
