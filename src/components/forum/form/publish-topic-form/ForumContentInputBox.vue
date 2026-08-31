<script setup lang="ts">
import type { Editor as TiptapEditor } from '@tiptap/core'
import type { HTMLAttributes } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import { useQueryCache } from '@pinia/colada'
import Placeholder from '@tiptap/extension-placeholder'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import { useVModel } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { data as forumDocumentLinks } from '~/_data/forumDocumentLinks.data'
import { useForumImageDropZone } from '~/composables/forum/useForumImageDropZone'
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
const activeFormats = ref<TextFormat[]>([])
const queryCache = useQueryCache()
const { message } = useLocalized()

type TextFormat = 'bold' | 'italic' | 'strike'

function syncActiveFormats(currentEditor: TiptapEditor): void {
  activeFormats.value = (['bold', 'italic', 'strike'] as const).filter(format => currentEditor.isActive(format))
}

function toggleFormat(format: TextFormat): void {
  const chain = editor.value?.chain().focus()
  if (!chain)
    return
  if (format === 'bold')
    chain.toggleBold().run()
  else if (format === 'italic')
    chain.toggleItalic().run()
  else
    chain.toggleStrike().run()
}

function shouldShowFormatMenu({ editor: currentEditor, from, to }: {
  editor: TiptapEditor
  from: number
  to: number
}): boolean {
  return from !== to
    && !currentEditor.isActive('code')
    && currentEditor.state.doc.textBetween(from, to).trim().length > 0
}

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

const dropZone = useTemplateRef<HTMLElement>('drop-zone')
const { isOverDropZone } = useForumImageDropZone(dropZone, {
  disabled: () => !props.supportPaste,
  onFiles: files => emits('paste-files', files),
})

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
    enableInputRules: ['blockquote', 'bold', 'bulletList', 'code', 'italic', 'orderedList', 'strike'],
    onUpdate: ({ editor: currentEditor }) => {
      modelValue.value = currentEditor.getMarkdown()
    },
    onFocus: () => {
      focused.value = true
    },
    onSelectionUpdate: ({ editor: currentEditor }) => syncActiveFormats(currentEditor),
    onTransaction: ({ editor: currentEditor }) => syncActiveFormats(currentEditor),
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
        ref="drop-zone"
        class="body letter-content-input px-3 py-2 border vp-border-input border-input rounded-md border-style-solid bg-transparent shadow-sm transition-colors relative placeholder:text-muted-foreground"
        :class="
          cn(
            focused
              ? 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              : '',
          )
        "
      >
        <div class="editor min-h-inherit relative">
          <BubbleMenu
            v-if="editor"
            :editor="editor"
            :should-show="shouldShowFormatMenu"
            :options="{ placement: 'top', offset: 8 }"
          >
            <ToggleGroup
              type="multiple"
              size="sm"
              :model-value="activeFormats"
              class="p-1 border border-[var(--vp-c-divider)] border-solid bg-[var(--vp-c-bg-elv)] shadow-lg"
            >
              <ToggleGroupItem
                value="bold"
                class="px-0 size-8"
                :aria-label="message.forum.publish.feedbackForm.formatBold"
                :title="message.forum.publish.feedbackForm.formatBold"
                @mousedown.prevent
                @click="toggleFormat('bold')"
              >
                <span class="i-lucide-bold size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="italic"
                class="px-0 size-8"
                :aria-label="message.forum.publish.feedbackForm.formatItalic"
                :title="message.forum.publish.feedbackForm.formatItalic"
                @mousedown.prevent
                @click="toggleFormat('italic')"
              >
                <span class="i-lucide-italic size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="strike"
                class="px-0 size-8"
                :aria-label="message.forum.publish.feedbackForm.formatStrike"
                :title="message.forum.publish.feedbackForm.formatStrike"
                @mousedown.prevent
                @click="toggleFormat('strike')"
              >
                <span class="i-lucide-strikethrough size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </BubbleMenu>
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

        <div v-if="isOverDropZone" class="drop-overlay" aria-hidden="true">
          <span class="i-lucide-images size-5" />
          <span>{{ message.forum.publish.feedbackForm.addImages }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drop-overlay {
  position: absolute;
  z-index: 20;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 2px dashed var(--vp-c-brand-1);
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--vp-c-bg-elv) 86%, transparent);
  color: var(--vp-c-brand-1);
  font-size: 0.875rem;
  font-weight: 600;
  pointer-events: none;
}

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
