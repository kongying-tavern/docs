<script setup lang="ts">
import type { JSONContent, Editor as TiptapEditor } from '@tiptap/core'
import type { HTMLAttributes } from 'vue'
import type { EmojiItem } from '@/components/ui/EmojiPicker.vue'
import type ForumAPI from '~/forum/api/types'
import type { ImageAttachment } from '~/forum/services/form/imageAttachment'
import { useQueryCache } from '@pinia/colada'
import { ReloadIcon } from '@radix-icons/vue'
import CharacterCount from '@tiptap/extension-character-count'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { onClickOutside } from '@vueuse/core'
import { isEqual } from 'lodash-es'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { Button } from '@/components/ui/button'
import EmojiPicker from '@/components/ui/EmojiPicker.vue'
import InputPlaceholders from '@/components/ui/InputPlaceholders.vue'
import MentionPicker from '@/components/ui/MentionPicker.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { useEmojiPreload } from '~/composables/useGlobalEmojiPreloader'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { useForumEditorShortcuts } from '~/forum/composables/view/useForumEditorShortcuts'
import { useForumImageDropZone } from '~/forum/composables/view/useForumImageDropZone'
import { collectForumTopics, forumKeys } from '~/forum/services/forumQueryContracts'
import { createForumContentExtensions } from '~/forum/services/forumTiptapExtensions'
import { createForumSuggestionRenderer } from '~/forum/tiptap/forumSuggestionRenderer'
import ForumImageUpload from './ForumImageUpload.vue'

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
  modelValue?: JSONContent | null
  /** 无可见标签场景（评论框）下的可访问名称 */
  ariaLabel?: string
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
  modelValue: null,
})

const emit = defineEmits<{
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'input', value: string): void
  (e: 'emoji:select', emoji: EmojiItem): void
  (e: 'mention:select', user: ForumAPI.User): void
  (e: 'files-selected', files: File[]): void
  (e: 'remove-attachment', id: string): void
  (e: 'retry-attachment', id: string): void
  (e: 'submit'): void
  (e: 'update:modelValue', value: JSONContent): void
}>()

const { message } = useLocalized()
const container = useTemplateRef('textarea-container')
const imageUpload = useTemplateRef<InstanceType<typeof ForumImageUpload>>('imageUpload')
const hideFooter = ref(props.collapse)
const editor = shallowRef<TiptapEditor | null>(null)
const isEditorFocused = ref(false)
const showMentionPicker = ref(false)
const showEmojiPicker = ref(false)
const queryCache = useQueryCache()
const emojiPreload = useEmojiPreload()

// ProseMirror 深代理是性能陷阱，编辑器勿改回深响应式 ref；统计值在文档变更时显式同步
const charCount = ref(0)
const percentage = computed(() => Math.round((100 / props.maxTextLength) * charCount.value))
const text = ref('')
const { reducedMotion } = useSitePreferences()
const entryMotion = computed(() => (props.entryAnimation && !reducedMotion.value
  ? { initial: { y: -24, opacity: 0 }, enter: { y: 0, opacity: 1 } }
  : {}))

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
      }),
      shortcutExtension,
      CharacterCount.configure({ limit: props.maxTextLength }),
    ],
    content: props.modelValue ?? emptyDoc(),
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
      emit('update:modelValue', currentEditor.getJSON())
      emit('input', currentEditor.getText({ blockSeparator: '\n' }))
    },
    onFocus: () => {
      isEditorFocused.value = true
      hideFooter.value = false
      emit('focus', new FocusEvent('focus'))
    },
    onBlur: () => {
      isEditorFocused.value = false
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
        editor.value?.view.focus({ preventScroll: true })
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
  editor.value?.chain().focus().insertContent({
    type: 'emoji',
    attrs: {
      emoji: emoji.emoji,
      width: emoji.width,
      height: emoji.height,
    },
  }).run()
  emit('emoji:select', emoji)
}

function handleMentionSelect(user: ForumAPI.User): void {
  if (props.disabled || props.loading)
    return
  hideFooter.value = false
  editor.value?.chain().focus().insertContent({
    type: 'mention',
    attrs: {
      id: user.id,
      label: user.login,
    },
  }).run()
  emit('mention:select', user)
}

function emitFiles(files: File[]): void {
  if (files.length)
    emit('files-selected', files)
}

function handlePaste(event: ClipboardEvent): void {
  if (!props.disabled && !props.loading && props.features.includes('Upload') && event.clipboardData)
    emitFiles([...event.clipboardData.files])
}

const { isOverDropZone } = useForumImageDropZone(container, {
  disabled: computed(() => props.disabled || props.loading || !props.features.includes('Upload')),
  onFiles: emitFiles,
})

function handleSubmit(): void {
  if (!props.disabled && !props.loading && charCount.value > 0)
    emit('submit')
}

watch(() => props.modelValue, (value) => {
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
    editor.value?.view.focus({ preventScroll: true })
}

onBeforeUnmount(() => {
  clearTimeout(autofocusTimer)
  editor.value?.destroy()
})
</script>

<template>
  <div
    ref="textarea-container"
    v-motion
    :initial="entryMotion.initial"
    :enter="entryMotion.enter"
    class="forum-rich-textarea flex relative"
    :class="cn('w-full flex', containerClass)"
    @paste="handlePaste"
  >
    <div class="comment-area w-full">
      <div class="body relative">
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
            v-if="!isEditorFocused && attachments.length === 0"
            :text="text"
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

          <ForumImageUpload
            v-if="features.includes('Upload')"
            ref="imageUpload"
            :attachments="attachments"
            :disabled="disabled || loading"
            :hide-default-trigger="true"
            size="sm"
            :class="{ hidden: attachments.length === 0 }"
            @files-selected="emitFiles"
            @remove="$emit('remove-attachment', $event)"
            @retry="$emit('retry-attachment', $event)"
            @paste.stop
          />

          <div
            v-if="showCharacterCounter"
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
      <div
        v-if="features.length !== 0 && toolbarPosition === 'bottom'"
        v-show="!collapse || !hideFooter"
        v-motion
        :initial="entryMotion.initial"
        :enter="entryMotion.enter"
        class="footer mt-2.5 flex w-full items-center justify-between"
      >
        <div class="tool flex gap-1 items-center">
          <EmojiPicker v-if="features.includes('Emoji')" v-model:open="showEmojiPicker" :disabled="disabled || loading" @close-auto-focus="restoreEditorFocus" @select="handleEmojiSelect" />

          <MentionPicker v-if="features.includes('Mention')" v-model:open="showMentionPicker" :disabled="disabled || loading" @close-auto-focus="restoreEditorFocus" @select="handleMentionSelect" />

          <Button
            v-if="features.includes('Upload')"
            type="button"
            variant="ghost"
            size="icon-sm"
            :disabled="disabled || loading"
            :aria-label="message.forum.publish.feedbackForm.addImages"
            @click="imageUpload?.open()"
          >
            <span class="i-lucide:image c-[var(--vp-c-text-2)] icon-btn size-4" />
          </Button>
        </div>

        <div v-if="features.includes('Submit')" class="btn flex">
          <Button type="button" :disabled="disabled || loading || charCount === 0" @click="handleSubmit">
            <ReloadIcon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ message.ui.button.submit }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.comment-drop-overlay {
  position: absolute;
  z-index: 20;
  border: 2px dashed var(--vp-c-brand-1);
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
  svg {
    color: var(--vp-c-green-3);
  }

  &--warning,
  &--warning svg {
    color: var(--vp-c-red-3);
  }
}
</style>
