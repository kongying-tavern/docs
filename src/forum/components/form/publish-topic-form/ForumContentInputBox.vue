<script setup lang="ts">
import type { Editor as TiptapEditor } from '@tiptap/core'
import type { HTMLAttributes } from 'vue'
import type ForumAPI from '~/forum/api/types'
import { AtSignIcon, BoldIcon, HashIcon, ImagePlusIcon, ItalicIcon, StrikethroughIcon } from '@lucide/vue'
import { useQueryCache } from '@pinia/colada'
import Placeholder from '@tiptap/extension-placeholder'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import { onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { Button } from '@/components/ui/button'
import MentionPicker from '@/components/ui/MentionPicker.vue'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { data as forumDocumentLinks } from '~/_data/forumDocumentLinks.data'
import { useForumEditorShortcuts } from '~/forum/composables/view/useForumEditorShortcuts'
import { useForumImageDropZone } from '~/forum/composables/view/useForumImageDropZone'
import { forumTextToEditorDoc } from '~/forum/services/forumLegacyContent'
import { collectForumTopics, forumKeys } from '~/forum/services/forumQueryContracts'
import { createForumTopicEditorExtensions } from '~/forum/services/forumTiptapExtensions'
import { createForumSuggestionRenderer } from '~/forum/tiptap/forumSuggestionRenderer'

defineOptions({ inheritAttrs: false })

const { supportDrop = true, supportPaste, imageSelectionDisabled, placeholder, id, ariaInvalid, ariaLabel, ariaDescribedby, class: className } = defineProps<{
  id?: string
  class?: HTMLAttributes['class']
  placeholder?: string
  supportPaste?: boolean
  supportDrop?: boolean
  showToolbar?: boolean
  imageSelectionDisabled?: boolean
  ariaInvalid?: boolean
  /** contenteditable 不是 labelable 元素，<label for> 关联不上，需显式可访问名称 */
  ariaLabel?: string
  ariaDescribedby?: string
  borderless?: boolean
}>()

const emits = defineEmits<{
  'paste-files': [files: File[]]
  'select-images': []
  'blur': [event: FocusEvent]
}>()

const modelValue = defineModel<string>({ default: '' })

const editor = shallowRef<TiptapEditor | null>(null)
const shortcutExtension = useForumEditorShortcuts()
const activeFormats = ref<TextFormat[]>([])
const showMentionPicker = ref(false)
const formatMenu = useTemplateRef<InstanceType<typeof ToggleGroup>>('format-menu')
const queryCache = useQueryCache()
const { message } = useLocalized()

type TextFormat = 'bold' | 'italic' | 'strike'

const formatActions = [
  { value: 'bold', icon: BoldIcon, label: 'formatBold' },
  { value: 'italic', icon: ItalicIcon, label: 'formatItalic' },
  { value: 'strike', icon: StrikethroughIcon, label: 'formatStrike' },
] as const
const WHITESPACE_REGEX = /\s/u

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
  const hasFocus = currentEditor.isFocused || formatMenu.value?.$el.contains(document.activeElement)
  return currentEditor.isEditable && Boolean(hasFocus) && !currentEditor.view.composing && from !== to
    && !currentEditor.isActive('code')
    && currentEditor.state.doc.textBetween(from, to).trim().length > 0
}

function getLoadedTopics(): ForumAPI.Topic[] {
  return collectForumTopics(
    queryCache.getEntries({ key: forumKeys.topics() }).map(entry => entry.state.value.data),
  )
}

function openTopicSearch(): void {
  const currentEditor = editor.value
  if (!currentEditor)
    return
  const { from } = currentEditor.state.selection
  const previousCharacter = currentEditor.state.doc.textBetween(Math.max(0, from - 1), from)
  currentEditor.chain().focus().insertContent(`${previousCharacter && !WHITESPACE_REGEX.test(previousCharacter) ? ' ' : ''}#`).run()
}

function handleMentionSelect(user: ForumAPI.User): void {
  editor.value?.chain().focus().insertContent([
    { type: 'mention', attrs: { id: user.id, label: user.login } },
    { type: 'text', text: ' ' },
  ]).run()
}

function restoreEditorFocus(event: Event): void {
  event.preventDefault()
  editor.value?.view.dom.focus({ preventScroll: true })
}

function handlePaste(event: ClipboardEvent): void {
  if (!supportPaste || !event.clipboardData)
    return
  const files = [...event.clipboardData.files]
  if (files.length)
    emits('paste-files', files)
}

const dropZone = useTemplateRef<HTMLElement>('drop-zone')
const { isOverDropZone } = useForumImageDropZone(dropZone, {
  disabled: () => !supportPaste || !supportDrop || imageSelectionDisabled,
  onFiles: files => emits('paste-files', files),
})

onMounted(() => {
  editor.value = new Editor({
    extensions: [
      shortcutExtension,
      ...createForumTopicEditorExtensions({
        documentLinks: forumDocumentLinks,
        getTopics: getLoadedTopics,
        suggestionRender: createForumSuggestionRenderer(),
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: forumTextToEditorDoc(modelValue.value || ''),
    enableInputRules: ['blockquote', 'bold', 'bulletList', 'code', 'italic', 'orderedList', 'strike', 'topicReference'],
    onUpdate: ({ editor: currentEditor }) => {
      modelValue.value = currentEditor.isEmpty ? '' : JSON.stringify(currentEditor.getJSON())
    },
    onSelectionUpdate: ({ editor: currentEditor }) => syncActiveFormats(currentEditor),
    onTransaction: ({ editor: currentEditor }) => syncActiveFormats(currentEditor),
    onBlur: ({ event }) => {
      emits('blur', event)
    },
    editorProps: {
      attributes: {
        'class': 'outline-none min-h-inherit',
        ...(id ? { id } : {}),
        'role': 'textbox',
        'aria-multiline': 'true',
        'aria-invalid': String(Boolean(ariaInvalid)),
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
        'aria-describedby': ariaDescribedby || '',
      },
    },
  })
})

watch(modelValue, (value) => {
  if (!editor.value || JSON.stringify(editor.value.getJSON()) === value)
    return
  editor.value.commands.setContent(forumTextToEditorDoc(value || ''), { emitUpdate: false })
})

onBeforeUnmount(() => editor.value?.destroy())

watch(() => [ariaInvalid, ariaLabel, ariaDescribedby] as const, ([invalid, label, describedby]) => {
  editor.value?.setOptions({ editorProps: { attributes: {
    ...editor.value.options.editorProps.attributes,
    'aria-invalid': String(Boolean(invalid)),
    'aria-label': label || '',
    'aria-describedby': describedby || '',
  } } })
})
</script>

<template>
  <div
    class="flex"
    @paste="handlePaste"
  >
    <div class="comment-area w-full">
      <div
        ref="drop-zone"
        class="body px-3 py-3 border border-input rounded-md bg-transparent shadow-xs transition-[border-color,box-shadow] relative focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
        :class="{ 'border-destructive': ariaInvalid, 'compact-content-input': borderless, 'letter-content-input': !borderless }"
      >
        <div class="editor min-h-inherit relative">
          <BubbleMenu
            v-if="editor"
            :editor="editor"
            :should-show="shouldShowFormatMenu"
            :options="{ placement: 'top', offset: 8, flip: { padding: 12 }, shift: { padding: 12 } }"
          >
            <ToggleGroup
              ref="format-menu"
              type="multiple"
              size="sm"
              :model-value="activeFormats"
              class="forum-format-menu"
            >
              <ToggleGroupItem
                v-for="action in formatActions"
                :key="action.value"
                :value="action.value"
                class="px-0 size-8"
                :aria-label="message.forum.publish.feedbackForm[action.label]"
                :title="message.forum.publish.feedbackForm[action.label]"
                @mousedown.prevent
                @click="toggleFormat(action.value)"
              >
                <component :is="action.icon" />
              </ToggleGroupItem>
            </ToggleGroup>
          </BubbleMenu>
          <EditorContent
            v-if="editor"
            data-clarity-mask="true"
            :editor="(editor as InstanceType<typeof Editor>)"
            :class="cn('forum-rich-editor custom-scrollbar h-auto max-h-256px w-full cursor-text overflow-y-auto bg-transparent text-base md:text-sm leading-6', className)"
          />
        </div>
        <slot name="after-editor" />
        <slot name="uploader" />

        <div v-if="showToolbar" class="pt-2 flex gap-1 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            :disabled="imageSelectionDisabled"
            :aria-label="message.forum.publish.feedbackForm.addImages"
            :title="message.forum.publish.feedbackForm.addImages"
            @click="emits('select-images')"
          >
            <ImagePlusIcon :size="16" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            :aria-label="message.forum.publish.feedbackForm.referenceTopic"
            :title="message.forum.publish.feedbackForm.referenceTopic"
            @mousedown.prevent
            @click="openTopicSearch"
          >
            <HashIcon :size="16" />
          </Button>
          <MentionPicker
            v-model:open="showMentionPicker"
            side="top"
            @select="handleMentionSelect"
            @close-auto-focus="restoreEditorFocus"
          >
            <template #trigger>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                :aria-label="message.forum.publish.feedbackForm.mentionUser"
                :title="message.forum.publish.feedbackForm.mentionUser"
              >
                <AtSignIcon :size="16" />
              </Button>
            </template>
          </MentionPicker>
        </div>

        <div v-if="isOverDropZone" class="drop-overlay" aria-hidden="true">
          <span class="i-lucide-images size-5" />
          <span>{{ message.forum.publish.feedbackForm.addImages }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.compact-content-input {
  padding: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.compact-content-input:focus-within {
  box-shadow: none;
}
.compact-content-input :deep(.tiptap:focus-visible) {
  outline: 2px solid oklch(var(--ring));
  outline-offset: 4px;
  border-radius: 2px;
}
</style>

<style scoped>
.drop-overlay {
  position: absolute;
  z-index: 20;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 2px dashed oklch(var(--ring));
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--vp-c-bg-elv) 86%, transparent);
  color: var(--vp-c-brand-1);
  font-size: calc(14px * var(--site-ui-scale));
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

.forum-format-menu {
  padding: 0.25rem;
  border: 1px solid oklch(var(--border));
  border-radius: var(--radius);
  background: oklch(var(--popover));
  color: oklch(var(--popover-foreground));
  box-shadow: var(--vp-shadow-2);
}

:deep(.tiptap :is(ul, ol)) {
  margin: 0.5rem 0;
  padding-inline-start: 1.5rem;
}

:deep(.tiptap ul) {
  list-style: disc;
}
:deep(.tiptap ol) {
  list-style: decimal;
}

:deep(.tiptap blockquote) {
  margin: 0.5rem 0;
  padding-inline-start: 0.75rem;
  border-inline-start: 3px solid oklch(var(--border));
  color: oklch(var(--muted-foreground));
}

:deep(.tiptap code) {
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  background: oklch(var(--muted));
  font-size: 0.875em;
}

:deep(.tiptap .forum-topic-reference) {
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  background: oklch(var(--accent));
  color: oklch(var(--accent-foreground));
  white-space: nowrap;
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
  font-size: calc(14px * var(--site-ui-scale));
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'/%3E%3Cpolyline points='14 2 14 8 20 8'/%3E%3Cline x1='16' x2='8' y1='13' y2='13'/%3E%3Cline x1='16' x2='8' y1='17' y2='17'/%3E%3Cline x1='10' x2='8' y1='9' y2='9'/%3E%3C/svg%3E")
    center / contain no-repeat;
}

:deep(.tiptap [data-link-display]::after) {
  content: attr(data-link-display);
  font-size: calc(14px * var(--site-ui-scale));
}
</style>
