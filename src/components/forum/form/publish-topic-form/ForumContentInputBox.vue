<script setup lang="ts">
import type { Editor as TiptapEditor } from '@tiptap/core'
import type { HTMLAttributes } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import { useQueryCache } from '@pinia/colada'
import Placeholder from '@tiptap/extension-placeholder'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { useVModel } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { cn } from '@/lib/utils'
import { data as forumDocumentLinks } from '~/_data/forumDocumentLinks.data'
import { createForumSuggestionRenderer } from '~/composables/tiptap/forumSuggestionRenderer'
import { collectForumTopics, forumKeys } from '~/services/forum/forumQueryContracts'
import { createForumTopicEditorExtensions } from '~/services/forum/forumTiptapExtensions'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  id?: string
  modelValue?: string
  textLimit: number
  textMinLimit?: number
  class?: HTMLAttributes['class']
  defaultValue?: string
  placeholder?: string
  supportPaste?: boolean
}>(), {
  modelValue: '',
})

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string): void
  (e: 'paste-files', files: File[]): void
  (e: 'blur', event: FocusEvent): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

const editor = shallowRef<TiptapEditor | null>(null)
const focused = ref(false)
const queryCache = useQueryCache()

function getLoadedTopics(): ForumAPI.Topic[] {
  return collectForumTopics(
    queryCache.getEntries({ key: forumKeys.topics() }).map(entry => entry.state.value.data),
  )
}

function handlePaste(event: ClipboardEvent): void {
  if (!props.supportPaste || !event.clipboardData)
    return
  const files = [...event.clipboardData.files]
  if (files.length)
    emits('paste-files', files)
}

onMounted(() => {
  editor.value = new Editor({
    extensions: [
      ...createForumTopicEditorExtensions({
        documentLinks: forumDocumentLinks,
        getTopics: getLoadedTopics,
        suggestionRender: createForumSuggestionRenderer(),
      }),
      Placeholder.configure({ placeholder: props.placeholder }),
    ],
    content: modelValue.value || '',
    contentType: 'markdown',
    enableInputRules: ['blockquote', 'bold', 'bulletList', 'code', 'codeBlock', 'italic', 'orderedList', 'strike'],
    onUpdate: ({ editor: currentEditor }) => {
      modelValue.value = currentEditor.getMarkdown()
    },
    onFocus: () => {
      focused.value = true
    },
    onBlur: ({ event }) => {
      focused.value = false
      emits('blur', event)
    },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-inherit',
        ...(props.id ? { id: props.id } : {}),
      },
    },
  })
})

watch(modelValue, (value) => {
  if (!editor.value || editor.value.getMarkdown() === value)
    return
  editor.value.commands.setContent(value || '', { contentType: 'markdown', emitUpdate: false })
})

onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
  <div
    class="flex"
    @paste="handlePaste"
  >
    <div class="comment-area w-full">
      <div
        class="body letter-content-input px-3 py-2 border vp-border-input border-input rounded-md border-style-solid bg-transparent shadow-sm transition-colors placeholder:text-muted-foreground"
        :class="
          cn(
            focused
              ? 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              : '',
          )
        "
      >
        <div class="editor min-h-inherit relative">
          <EditorContent
            v-if="editor"
            :editor="(editor as InstanceType<typeof Editor>)"
            :class="cn('forum-markdown-editor h-auto max-h-256px w-full cursor-text overflow-y-auto bg-transparent text-sm leading-6', props.class)"
          />
          <span class="text-xs c-[var(--vp-c-text-3)] mt-1 flex justify-end">
            <span :class="modelValue?.length < (textMinLimit || -1) || modelValue?.length > (textLimit || -1) ? 'c-red' : ''">
              {{ modelValue?.length || 0 }}
            </span>
            / {{ textLimit }}
          </span>
        </div>
        <slot name="uploader" />
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.tiptap) {
  min-height: inherit;
  white-space: pre-wrap;
}

:deep(.tiptap p) {
  margin: 0;
}

:deep(.tiptap p.is-editor-empty:first-child::before) {
  color: var(--vp-c-text-3);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

:deep(.tiptap a) {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

:deep(.tiptap .forum-document-link--editor),
:deep(.tiptap .forum-external-link--editor) {
  font-size: 0;
}

:deep(.tiptap .forum-document-link--editor::before) {
  width: 1em;
  height: 1em;
  background: currentcolor;
  content: '';
  font-size: 0.875rem;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'/%3E%3Cpolyline points='14 2 14 8 20 8'/%3E%3Cline x1='16' x2='8' y1='13' y2='13'/%3E%3Cline x1='16' x2='8' y1='17' y2='17'/%3E%3Cline x1='10' x2='8' y1='9' y2='9'/%3E%3C/svg%3E") center / contain no-repeat;
}

:deep(.tiptap [data-link-display]::after) {
  content: attr(data-link-display);
  font-size: 0.875rem;
}
</style>
