<script setup lang="ts">
import type { JSONContent, Editor as TiptapEditor } from '@tiptap/core'
import type { HTMLAttributes } from 'vue'
import type { EmojiItem } from '@/components/ui/EmojiPicker.vue'
import type ForumAPI from '~/forum/api/types'
import type { ImageAttachment } from '~/forum/services/form/imageAttachment'
import { useQueryCache } from '@pinia/colada'
import CharacterCount from '@tiptap/extension-character-count'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { createReusableTemplate, onClickOutside } from '@vueuse/core'
import { isEqual } from 'lodash-es'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import EmojiPicker from '@/components/ui/EmojiPicker.vue'
import InputPlaceholders from '@/components/ui/InputPlaceholders.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { useEmojiPreload } from '~/composables/useGlobalEmojiPreloader'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { useForumEditorShortcuts } from '~/forum/composables/view/useForumEditorShortcuts'
import { useForumImageDropZone } from '~/forum/composables/view/useForumImageDropZone'
import { useForumMentionCandidates } from '~/forum/composables/view/useForumMentionCandidates'
import { useMobileEditorMention } from '~/forum/composables/view/useMobileEditorMention'
import { IMAGE_UPLOAD_POLICY } from '~/forum/services/forumConfig'
import { collectForumTopics, forumKeys } from '~/forum/services/forumQueryContracts'
import { createForumContentExtensions } from '~/forum/services/forumTiptapExtensions'
import { createForumSuggestionRenderer } from '~/forum/tiptap/forumSuggestionRenderer'
import ForumEditorTools from './ForumEditorTools.vue'
import ForumImageUpload from './ForumImageUpload.vue'
import ForumMentionRecommendations from './ForumMentionRecommendations.vue'

type SupportFeature = 'Upload' | 'Emoji' | 'Mention' | 'Submit'

interface Props {
  attachments?: ImageAttachment[]
  placeholders?: string[] | string
  replyTarget?: string
  collapse?: boolean
  maxTextLength?: number
  disabled?: boolean
  features?: SupportFeature[]
  class?: HTMLAttributes['class']
  containerClass?: HTMLAttributes['class']
  toolbarPosition?: 'inner' | 'bottom'
  loading?: boolean
  showCharacterCounter?: boolean
  autoHideFooter?: boolean
  autofocus?: boolean
  entryAnimation?: boolean
  /** 无可见标签场景（评论框）下的可访问名称 */
  ariaLabel?: string
  mobile?: boolean
  borderless?: boolean
  active?: boolean
  mentionUsers?: ForumAPI.User[]
}

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<Props>(), {
  attachments: () => [],
  replyTarget: '',
  collapse: true,
  features: () => ['Upload', 'Emoji', 'Mention', 'Submit'],
  maxTextLength: 500,
  disabled: false,
  toolbarPosition: 'bottom',
  loading: false,
  showCharacterCounter: false,
  autoHideFooter: true,
  entryAnimation: true,
  active: true,
  mentionUsers: () => [],
})

const emit = defineEmits<{
  'focus': [event: FocusEvent]
  'blur': [event: FocusEvent]
  'input': [value: string]
  'emoji:select': [emoji: EmojiItem]
  'mention:select': [user: ForumAPI.User]
  'files-selected': [files: File[]]
  'remove-attachment': [id: string]
  'retry-attachment': [id: string]
  'submit': []
}>()

const modelValue = defineModel<JSONContent | null>({ default: null })

const { message } = useLocalized()
const container = useTemplateRef('textarea-container')
const imageUpload = useTemplateRef<InstanceType<typeof ForumImageUpload>>('imageUpload')
const [ImageAttachments, AttachmentContent] = createReusableTemplate()
const hideFooter = ref(props.collapse)
const editor = shallowRef<TiptapEditor | null>(null)
const isEditorFocused = ref(false)
const mentionDrawerOpen = ref(false)
const showMentionPicker = ref(false)
const showEmojiPicker = ref(false)
const tools = useTemplateRef<InstanceType<typeof ForumEditorTools>>('tools')
const mentionCandidates = useForumMentionCandidates(() => props.mentionUsers)
const mobileMention = useMobileEditorMention(editor, () => mentionCandidates.users.value, (user) => {
  mentionCandidates.remember(user)
  emit('mention:select', user)
}, () => !!props.mobile)
let savedSelection: { from: number, to: number } | undefined
const text = ref('')
const uploadBusy = computed(() => props.attachments.some(item => item.status === 'queued' || item.status === 'processing' || item.status === 'uploading'))
const uploadFailed = computed(() => props.attachments.some(item => item.status === 'failed'))
const submitBlocked = computed(() => props.loading || uploadBusy.value || uploadFailed.value || !text.value.trim())
const uploadStatus = computed(() => uploadFailed.value
  ? message.value.forum.publish.feedbackForm.uploadFailed
  : uploadBusy.value
    ? message.value.forum.publish.feedbackForm.uploadingImages
        .replace('{settled}', String(props.attachments.filter(item => item.status === 'uploaded').length))
        .replace('{total}', String(props.attachments.length))
    : '')
const queryCache = useQueryCache()
const emojiPreload = useEmojiPreload()

// ProseMirror 深代理是性能陷阱，编辑器勿改回深响应式 ref；统计值在文档变更时显式同步
const charCount = ref(0)
const percentage = computed(() => Math.round((100 / props.maxTextLength) * charCount.value))
const { reducedMotion } = useSitePreferences()

function syncEditorStats(ed: TiptapEditor): void {
  charCount.value = ed.storage.characterCount.characters()
  text.value = ed.getText({ blockSeparator: '\n' }) || ''
}

let autofocusTimer: ReturnType<typeof setTimeout> | undefined
const shortcutExtension = useForumEditorShortcuts({
  enabled: () => !props.disabled && !props.loading,
  send: () => {
    if (!props.features.includes('Submit') || charCount.value === 0)
      return false
    handleSubmit()
    return true
  },
})

function emptyDoc(): JSONContent {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

onMounted(() => {
  editor.value = new Editor({
    extensions: [
      ...createForumContentExtensions({
        getTopics: () => collectForumTopics(queryCache.getEntries({ key: forumKeys.topics() }).map(entry => entry.state.value.data)),
        suggestionRender: createForumSuggestionRenderer(),
        mentionSuggestionRender: props.mobile ? mobileMention.render : undefined,
        getMentionUsers: () => mentionCandidates.users.value,
      }),
      shortcutExtension,
      CharacterCount.configure({ limit: props.maxTextLength }),
    ],
    content: modelValue.value ?? emptyDoc(),
    editable: !props.disabled,
    autofocus: false,
    enableInputRules: ['topicReference'],
    enablePasteRules: ['topicReference'],
    coreExtensionOptions: {
      clipboardTextSerializer: {
        blockSeparator: '\n',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      syncEditorStats(currentEditor)
      modelValue.value = currentEditor.getJSON()
      emit('input', currentEditor.getText({ blockSeparator: '\n' }))
    },
    onFocus: () => {
      isEditorFocused.value = true
      hideFooter.value = false
      emit('focus', new FocusEvent('focus'))
    },
    onBlur: () => {
      isEditorFocused.value = false
      if (props.mobile && !mentionDrawerOpen.value)
        mobileMention.close()
      emit('blur', new FocusEvent('blur'))
    },
    editorProps: {
      attributes: {
        'class': cn('outline-none', props.class),
        // contenteditable div 不是 labelable 元素，<label for> 关联不上，需要显式补语义
        'role': 'textbox',
        'aria-multiline': 'true',
        ...(props.ariaLabel ? { 'aria-label': props.ariaLabel } : {}),
      },
    },
  })

  syncEditorStats(editor.value)

  // 按需聚焦输入框（不触发浏览器滚动到该元素；延迟避开 Dialog 打开动画的焦点接管）
  if (props.autofocus) {
    nextTick(() => {
      autofocusTimer = setTimeout(() => {
        editor.value?.view.dom.focus({ preventScroll: true })
      }, 160)
    })
  }
})

onClickOutside(container, () => {
  if (props.autoHideFooter && charCount.value === 0 && !showMentionPicker.value && !showEmojiPicker.value)
    hideFooter.value = true
})

function handleEmojiSelect(emoji: EmojiItem): void {
  if (props.disabled || props.loading)
    return
  hideFooter.value = false
  restoreSelection()
  editor.value?.chain().insertContent({
    type: 'emoji',
    attrs: {
      emoji: emoji.emoji,
      width: emoji.width,
      height: emoji.height,
    },
  }).run()
  savedSelection = undefined
  emit('emoji:select', emoji)
}

function handleMentionSelect(user: ForumAPI.User): void {
  if (props.disabled || props.loading)
    return
  hideFooter.value = false
  restoreSelection()
  editor.value?.chain().insertContent([{
    type: 'mention',
    attrs: {
      id: user.id,
      label: user.login,
    },
  }, { type: 'text', text: ' ' }]).run()
  mentionCandidates.remember(user)
  savedSelection = undefined
  emit('mention:select', user)
}

function emitFiles(files: File[]): void {
  if (files.length)
    emit('files-selected', files)
}

function handlePaste(event: ClipboardEvent): void {
  // The existing attachment component handles paste inside its own drop zone.
  if (event.target instanceof Element && event.target.closest('.forum-image-upload'))
    return
  if (!props.disabled && !props.loading && props.features.includes('Upload') && event.clipboardData)
    emitFiles([...event.clipboardData.files])
}

const { isOverDropZone } = useForumImageDropZone(container, {
  disabled: computed(() => props.disabled || props.loading || !props.features.includes('Upload')),
  onFiles: emitFiles,
})

function handleSubmit(): void {
  if (!props.disabled && !submitBlocked.value)
    emit('submit')
}

watch(modelValue, (value) => {
  if (!editor.value)
    return
  const nextValue = value ?? emptyDoc()
  if (!isEqual(editor.value.getJSON(), nextValue)) {
    editor.value.commands.setContent(nextValue)
    syncEditorStats(editor.value)
  }
}, { deep: true })

watch(() => props.disabled, (disabled) => {
  editor.value?.setEditable(!disabled)
})

watch(() => [props.disabled, props.loading], () => {
  if (props.disabled || props.loading) {
    showEmojiPicker.value = false
    showMentionPicker.value = false
  }
})

function restoreEditorFocus(event: Event): void {
  event.preventDefault()
  if (!props.disabled && !props.loading)
    editor.value?.view.dom.focus({ preventScroll: true })
}

function focus(): void {
  if (!props.disabled && props.active)
    editor.value?.view.dom.focus({ preventScroll: true })
}
function restoreSelection(): void {
  if (savedSelection && editor.value) {
    const max = editor.value.state.doc.content.size
    editor.value.commands.setTextSelection({ from: Math.min(savedSelection.from, max), to: Math.min(savedSelection.to, max) })
  }
}
function openTool(tool: 'emoji' | 'mention'): void {
  if (props.mobile && tool === 'mention') {
    mobileMention.begin()
    return
  }
  if (props.mobile)
    mobileMention.close()
  if (editor.value)
    savedSelection = { from: editor.value.state.selection.from, to: editor.value.state.selection.to }
  if (props.mobile) {
    editor.value?.commands.blur()
  }
}
function closeTool(restoreFocus = true): void {
  if (restoreFocus)
    restoreSelection()
  savedSelection = undefined
  if (restoreFocus)
    focus()
}
watch(() => props.active, (active) => {
  if (!active) {
    tools.value?.close()
    mobileMention.close()
    editor.value?.commands.blur()
  }
})
function activateTool(tool: 'emoji' | 'mention' | 'upload'): void {
  if (props.disabled || props.loading || !props.mobile)
    return
  hideFooter.value = false
  if (tool === 'upload')
    imageUpload.value?.open()
  else
    tools.value?.open(tool)
}
defineExpose({ focus, activateTool })

onBeforeUnmount(() => {
  clearTimeout(autofocusTimer)
  editor.value?.destroy()
})
</script>

<template>
  <ImageAttachments>
    <ForumImageUpload
      v-if="active && features.includes('Upload')"
      ref="imageUpload"
      :attachments="attachments"
      :disabled="disabled || loading"
      :hide-default-trigger="true"
      :card-preview="mobile"
      :hide-hint="mobile"
      :preview-max-height="mobile ? 128 : undefined"
      size="sm"
      :class="{ 'hidden': attachments.length === 0, 'mobile-image-attachments': mobile }"
      @files-selected="emitFiles"
      @remove="$emit('remove-attachment', $event)"
      @retry="$emit('retry-attachment', $event)"
    />
  </ImageAttachments>
  <div
    ref="textarea-container"
    class="forum-rich-textarea flex relative"
    :class="cn('w-full flex', containerClass, { 'comment-editor-mobile': mobile, 'comment-editor-borderless': borderless, 'content-enter': entryAnimation && !reducedMotion })"
    @paste="handlePaste"
  >
    <div class="comment-area w-full">
      <Transition name="mobile-mention">
        <div v-if="mobile && mobileMention.active.value" class="mobile-mention-region">
          <div class="mobile-mention-content">
            <ForumMentionRecommendations
              :items="mobileMention.items.value"
              :selected-index="mobileMention.selectedIndex.value" :selected-user-ids="mobileMention.selectedUserIds.value"
              :query="mobileMention.query.value"
              :groups="mentionCandidates.groups.value"
              :disabled="disabled || loading"
              @select="mobileMention.select"
              @drawer-open="mentionDrawerOpen = $event; !$event && nextTick(focus)"
            />
          </div>
        </div>
      </Transition>
      <div class="body rich-editor-scroll relative">
        <div
          class="px-2 pt-2 border border-input rounded-md border-solid bg-background h-fit min-h-48px w-full transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20"
          :class="{ 'pb-2': attachments.length > 0 }"
          @click="hideFooter = false"
          @focus="emojiPreload.smartPreload"
        >
          <div v-if="toolbarPosition === 'inner'" class="right-12px absolute">
            <EmojiPicker v-if="features.includes('Emoji')" v-model:open="showEmojiPicker" :disabled="disabled || loading" @close-auto-focus="restoreEditorFocus" @select="handleEmojiSelect" />
          </div>

          <InputPlaceholders
            v-if="active && !isEditorFocused && attachments.length === 0"
            :text="text"
            :align="mobile ? 'start' : 'center'"
            class="pl-2"
            :placeholders="replyTarget
              ? [`${message.forum.comment.reply} @${replyTarget}:`]
              : placeholders"
          />
          <EditorContent
            v-if="editor"
            data-clarity-mask="true"
            class="editor font-size-3.5 line-height-[32px] bg-transparent h-auto min-h-32px w-full cursor-text"
            :editor="(editor as InstanceType<typeof Editor>)"
          />
          <span v-if="mobile && mobileMention.showHint.value" class="mobile-mention-hint text-muted-foreground" :style="mobileMention.hintStyle.value">
            {{ message.forum.comment.mentionPlaceholder }}
          </span>

          <AttachmentContent v-if="!mobile" />

          <div
            v-if="showCharacterCounter || (mobile && charCount >= maxTextLength * 0.9)"
            class="character-count font-size-sm flex scale-80 items-center bottom-0 right-0 absolute"
            :class="{ 'character-count--warning': charCount === maxTextLength }"
          >
            <svg height="20" width="20" viewBox="0 0 20 20" class="mr-6px">
              <circle r="10" cx="10" cy="10" fill="var(--vp-c-bg-soft)" />
              <circle
                r="5"
                cx="10"
                cy="10"
                fill="transparent"
                stroke="currentColor"
                stroke-width="10"
                :stroke-dasharray="`calc(${percentage} * 31.4 / 100) 31.4`"
                transform="rotate(-90) translate(-20)"
              />
              <circle r="6" cx="10" cy="10" fill="var(--vp-c-bg-soft)" />
            </svg>

            {{ charCount }} / {{ maxTextLength }}
          </div>

          <div v-if="isOverDropZone" class="comment-drop-overlay" aria-hidden="true">
            <span class="i-lucide-images size-5" />
            <span>{{ message.forum.publish.feedbackForm.addImages }}</span>
          </div>
        </div>
      </div>
      <AttachmentContent v-if="mobile" />
      <ForumEditorTools
        v-if="features.length !== 0 && toolbarPosition === 'bottom'"
        v-show="!collapse || !hideFooter"
        ref="tools"
        class="footer mt-2.5"
        :features="features"
        :mobile="mobile"
        :mention-active="mobileMention.active.value"
        :disabled="disabled || loading"
        :submitting="loading"
        :submit-disabled="submitBlocked"
        :upload-disabled="attachments.length >= IMAGE_UPLOAD_POLICY.MAX_COUNT"
        :image-count="attachments.length"
        :mention-users="mentionCandidates.users.value"
        :status="active ? uploadStatus : ''"
        @tool-open="openTool"
        @tool-close="closeTool"
        @emoji="handleEmojiSelect"
        @mention="handleMentionSelect"
        @upload="imageUpload?.open()"
        @submit="handleSubmit"
      />
    </div>
  </div>
</template>

<style scoped>
@import '@/styles/media.css';
.comment-drop-overlay {
  position: absolute;
  z-index: 20;
  border: 2px dashed oklch(var(--ring));
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--vp-c-bg-elv) 86%, transparent);
  color: var(--vp-c-brand-1);
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  inset: 0;
  font-size: calc(14px * var(--site-ui-scale));
  font-weight: 600;
  pointer-events: none;
}

.character-count {
  font-variant-numeric: tabular-nums;

  svg {
    color: var(--vp-c-green-3);
  }
}
.character-count--warning,
.character-count--warning svg {
  color: var(--vp-c-red-3);
}
.comment-editor-mobile,
.comment-editor-mobile .comment-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.comment-editor-mobile .rich-editor-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  overscroll-behavior: contain;
  scroll-padding-block: 12px;
}
.comment-editor-mobile .rich-editor-scroll::-webkit-scrollbar {
  display: none;
}
.comment-editor-borderless .body > div {
  border: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
}
.comment-editor-mobile .editor {
  position: relative;
  font-size: calc(16px * var(--site-ui-scale));
  line-height: 1.625;
  min-height: 100px;
}
.comment-editor-mobile:has(.editor-tool-panel) .editor {
  min-height: 32px;
}
.mobile-mention-hint {
  position: absolute;
  right: 0;
  pointer-events: none;
  font-size: calc(16px * var(--site-ui-scale));
  line-height: 1.625;
  white-space: normal;
  overflow-wrap: break-word;
  word-break: normal;
}
.comment-editor-mobile .body > div:has(.mobile-mention-hint) {
  padding-bottom: calc(78px * var(--site-ui-scale));
}
.comment-editor-mobile .footer {
  margin-top: 12px;
}
.mobile-image-attachments {
  flex-shrink: 0;
}

.comment-editor-mobile :deep(.image-preview-list) {
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}
.comment-editor-mobile :deep(.image-preview-list::-webkit-scrollbar) {
  display: none;
}
.comment-editor-mobile :deep(.image-preview) {
  flex-shrink: 0;
}
.comment-editor-mobile :deep(.image-action),
.comment-editor-mobile :deep(.image-preview-list button) {
  min-width: 44px;
  min-height: 44px;
}
.mobile-mention-region {
  display: grid;
  grid-template-rows: 1fr;
  flex-shrink: 0;
}
.mobile-mention-content {
  min-height: 0;
  overflow: hidden;
}
.mobile-mention-enter-active {
  transition:
    grid-template-rows 220ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 160ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}
.mobile-mention-leave-active {
  transition:
    grid-template-rows 160ms ease-in,
    opacity 120ms ease,
    transform 160ms ease-in;
  pointer-events: none;
}
.mobile-mention-enter-from,
.mobile-mention-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
  transform: translateY(-4px);
}
@media (--motion-reduce) {
  .mobile-mention-enter-active,
  .mobile-mention-leave-active {
    transition: none;
  }
}
</style>
