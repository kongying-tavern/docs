<script setup lang="ts">
import type { JSONContent, Editor as TiptapEditor } from '@tiptap/core'
import type { HTMLAttributes } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import type { EmojiItem } from '@/components/ui/EmojiPicker.vue'
import type { ImageAttachment } from '~/services/forum/form/imageAttachment'
import { ReloadIcon } from '@radix-icons/vue'
import CharacterCount from '@tiptap/extension-character-count'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { onClickOutside } from '@vueuse/core'
import { isEqual } from 'lodash-es'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { Button } from '@/components/ui/button'
import EmojiPicker from '@/components/ui/EmojiPicker.vue'
import InputPlaceholders from '@/components/ui/InputPlaceholders.vue'
import MentionPicker from '@/components/ui/MentionPicker.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { useForumImageDropZone } from '~/composables/forum/useForumImageDropZone'
import { useEmojiPreload } from '~/composables/useGlobalEmojiPreloader'
import { createForumContentExtensions } from '~/services/forum/forumTiptapExtensions'
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
  modelValue?: JSONContent | null
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
const editor = ref<TiptapEditor | null>(null)
const isEditorFocused = ref(false)
const showMentionPicker = ref(false)
const emojiPreload = useEmojiPreload()

const charCount = computed(() => editor.value?.storage.characterCount.characters() ?? 0)
const percentage = computed(() => Math.round((100 / props.maxTextLength) * charCount.value))
const text = computed(() => editor.value?.getText({ blockSeparator: '\n' }) || '')

function emptyDoc(): JSONContent {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

onMounted(() => {
  editor.value = new Editor({
    extensions: [
      ...createForumContentExtensions(),
      CharacterCount.configure({ limit: props.maxTextLength }),
    ],
    content: props.modelValue ?? emptyDoc(),
    editable: !props.disabled,
    autofocus: false,
    enableInputRules: false,
    enablePasteRules: false,
    coreExtensionOptions: {
      clipboardTextSerializer: {
        blockSeparator: '\n',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
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
        class: cn('outline-none', props.class),
      },
    },
  })

  // 按需聚焦输入框（不触发浏览器滚动到该元素；延迟避开 Dialog 打开动画的焦点接管）
  if (props.autofocus) {
    nextTick(() => {
      const timer = setTimeout(() => {
        editor.value?.view.focus({ preventScroll: true })
      }, 160)
      onBeforeUnmount(() => clearTimeout(timer))
    })
  }
})

onClickOutside(container, () => {
  if (props.autoHideFooter && charCount.value === 0 && !showMentionPicker.value)
    hideFooter.value = true
})

function handleEmojiSelect(emoji: EmojiItem): void {
  hideFooter.value = false
  editor.value?.chain().insertContent({
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
  if (event.clipboardData)
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
  if (!isEqual(editor.value.getJSON(), nextValue))
    editor.value.commands.setContent(nextValue)
}, { deep: true })

watch(() => props.disabled, (disabled) => {
  editor.value?.setEditable(!disabled)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div
    ref="textarea-container"
    v-motion-slide-top
    class="forum-rich-textarea flex relative"
    :class="cn('w-full flex', containerClass)"
    @paste="handlePaste"
  >
    <div class="comment-area w-full">
      <div class="body relative">
        <div
          class="px-2 pt-2 border border-color-[var(--vp-c-gutter)] rounded-md bg-[var(--vp-c-bg-soft)] h-fit min-h-48px w-full focus:border-style-solid focus:bg-transparent"
          :class="{ 'pb-2': attachments.length > 0 }"
          @click="hideFooter = false"
          @focus="emojiPreload.smartPreload"
        >
          <div v-if="toolbarPosition === 'inner'" class="right-12px absolute">
            <EmojiPicker v-if="features.includes('Emoji')" class="border-none" :reference="container" @select="handleEmojiSelect" />
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
              <circle r="6" cx="10" cy="10" fill="white" />
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
        v-motion-slide-top
        class="footer mt-2.5 flex w-full items-center justify-between"
      >
        <div class="tool">
          <EmojiPicker v-if="features.includes('Emoji')" :reference="container" @select="handleEmojiSelect" />

          <MentionPicker v-if="features.includes('Mention')" v-model:open="showMentionPicker" class="ml-2" @select="handleMentionSelect" />

          <Button
            v-if="features.includes('Upload')"
            type="button"
            variant="ghost"
            class="ml-2 border border-[var(--vp-c-gutter)] border-solid bg-transparent h-8 w-6"
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
  font-size: 0.875rem;
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

:deep(.smart-link) {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  border-radius: 4px;
  padding: 2px 6px;
  transition: all 0.2s ease;
  font-weight: 500;

  &.bilibili-link {
    background-color: color-mix(in srgb, var(--forum-c-bilibili) 10%, transparent);
    color: var(--vp-c-text-1);
    border: 1px solid color-mix(in srgb, var(--forum-c-bilibili) 20%, transparent);

    &:hover {
      background-color: color-mix(in srgb, var(--forum-c-bilibili) 15%, transparent);
      border-color: color-mix(in srgb, var(--forum-c-bilibili) 30%, transparent);
      text-decoration: none;
    }
  }

  &.youtube-link {
    background-color: color-mix(in srgb, var(--forum-c-youtube) 10%, transparent);
    color: var(--vp-c-text-1);
    border: 1px solid color-mix(in srgb, var(--forum-c-youtube) 20%, transparent);

    &:hover {
      background-color: color-mix(in srgb, var(--forum-c-youtube) 15%, transparent);
      border-color: color-mix(in srgb, var(--forum-c-youtube) 30%, transparent);
      text-decoration: none;
    }
  }

  &.qq-link {
    background-color: var(--vp-c-brand-soft);
    color: var(--vp-c-text-1);
    border: 1px solid var(--vp-c-brand);

    &:hover {
      background-color: var(--vp-c-brand-softer);
      border-color: var(--vp-c-brand-2);
      text-decoration: none;
    }
  }

  &.url-link, &.domain-link {
    background-color: var(--vp-c-bg-alt);
    color: var(--vp-c-brand-1);
    border: 1px solid var(--vp-c-divider);

    &:hover {
      background-color: var(--vp-c-brand-soft);
      border-color: var(--vp-c-brand-1);
      text-decoration: none;
    }
  }

  .mr-1 {
    margin-right: 4px;
  }
}
</style>
