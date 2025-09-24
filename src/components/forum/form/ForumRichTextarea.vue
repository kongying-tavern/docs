<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { EmojiItem } from '@/components/ui/EmojiPicker.vue'
import type { Editor as TiptapEditor } from '@tiptap/core'
import type { HTMLAttributes } from 'vue'
import { Button } from '@/components/ui/button'
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'
import EmojiPicker from '@/components/ui/EmojiPicker.vue'
import InputPlaceholders from '@/components/ui/InputPlaceholders.vue'
import MentionPicker from '@/components/ui/MentionPicker.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { ReloadIcon } from '@radix-icons/vue'
import CharacterCount from '@tiptap/extension-character-count'
import StarterKit from '@tiptap/starter-kit'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { onClickOutside, useFileDialog } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { EmojiNode } from '~/composables/tiptap/emojiNode'
import { MentionNode } from '~/composables/tiptap/mentionNode'
import { useClipboardPaste } from '~/composables/useClipboardPaste'
import { useImageUpload } from '~/composables/useImageUpload'
import ForumImageUpload from './ForumImageUpload.vue'

type SupportFeature = 'Upload' | 'Emoji' | 'Mention' | 'Submit'

interface Props {
  placeholders?: string[] | string
  replyTarget?: string
  collapse?: boolean
  maxTextLength?: number
  disabled?: boolean
  loginRequired?: boolean
  features?: SupportFeature[]
  class?: HTMLAttributes['class']
  containerClass?: HTMLAttributes['class']
  uploadLimit?: number
  fileSizeLimit?: number
  accept?: string[]
  toolbarPosition?: 'inner' | 'bottom'
  loading?: boolean
  showCharacterCounter?: boolean
  autoHideFooter?: boolean
  showUploadDefaultTrigger?: boolean
  modelValue?: string
}

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<Props>(), {
  replyTarget: '',
  collapse: true,
  features: () => ['Upload', 'Emoji', 'Mention', 'Submit'],
  uploadLimit: 3,
  fileSizeLimit: 3,
  accept: () => ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
  maxTextLength: 500,
  disabled: false,
  loginRequired: true,
  toolbarPosition: 'bottom',
  loading: false,
  showCharacterCounter: false,
  autoHideFooter: true,
  showUploadDefaultTrigger: false,
  modelValue: '',
})

const emit = defineEmits<{
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'input', value: string): void
  (e: 'emoji:select', emoji: EmojiItem): void
  (e: 'mention:select', user: ForumAPI.User): void
  (e: 'submit', value: string): void
  (e: 'update:modelValue', value: string): void
}>()

const modelValue = computed({
  get: () => props.modelValue || '',
  set: value => emit('update:modelValue', value),
})

const userAuth = useUserAuthStore()
const { message } = useLocalized()

const container = useTemplateRef('textarea-container')
const hideFooter = ref(props.collapse)

const { open, onChange } = useFileDialog({
  accept: props.accept.join(','),
  directory: false,
})

const { isCompleted, markdownFormatImages, resetImageList, imageList, upload }
  = useImageUpload()

const photoWallRef = useTemplateRef('photoWallRef')

const { startListening, createUploadRawFile } = useClipboardPaste({
  accept: props.accept,
  maxFileSize: props.fileSizeLimit * 1024 * 1024,
  message,
  uploadLimit: props.uploadLimit,
  currentUploadCount: () => imageList.value.length,
  onPaste: (files) => {
    if (!photoWallRef.value?.handleStart)
      return

    try {
      // Directly pass files to the existing PhotoWall upload system
      for (const file of files) {
        const uploadRawFile = createUploadRawFile(file)
        photoWallRef.value.handleStart(uploadRawFile)
      }
    }
    catch (error) {
      console.error('Error processing pasted files:', error)
      const errorText = message.value?.forum?.publish?.form?.upload?.paste?.processingError
        || '处理粘贴文件时出错'
      toast.error(errorText)
    }
  },
})
const editor = ref<TiptapEditor | null>(null)
const isEditorFocused = ref(false)
const showMentionPicker = ref(false)
const stopClipboardListener = ref<(() => void) | null>(null)

const hasSelectedFile = computed(() => imageList.value.length > 0)
const text = computed(() => editor.value?.getText({ blockSeparator: '\n' }) || '')

onMounted(() => {
  if (editor.value)
    return
  editor.value = new Editor({
    extensions: [StarterKit, EmojiNode, MentionNode, CharacterCount.configure({ limit: props.maxTextLength })],
    content: modelValue.value || '',
    autofocus: true,
    coreExtensionOptions: {
      clipboardTextSerializer: {
        blockSeparator: '\n',
      },
    },
    onUpdate: ({ editor }) => {
      const currentText = editor.getText({ blockSeparator: '\n' })

      if (currentText !== modelValue.value.replace(markdownFormatImages.value, '')) {
        modelValue.value = currentText + markdownFormatImages.value
        emit('input', currentText)
      }
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

  // Start listening for clipboard paste events on the container
  if (props.features?.includes('Upload')) {
    // Use nextTick to ensure container is available
    nextTick(() => {
      if (container.value) {
        stopClipboardListener.value = startListening(container.value)
      }
    })
  }
})

const charCount = computed(() => {
  return editor.value ? editor.value.storage.characterCount.characters() : 0
})

const percentage = computed(() => {
  return Math.round((100 / props.maxTextLength) * charCount.value)
})

onClickOutside(container, () => {
  if (props.autoHideFooter && (charCount.value === 0 && !showMentionPicker.value)) {
    hideFooter.value = true
  }
})

function handleEmojiSelect(emoji: EmojiItem) {
  hideFooter.value = false
  insertEmoji(emoji)
  emit('emoji:select', emoji)
}

function handleMentionSelect(user: ForumAPI.User) {
  hideFooter.value = false
  insertMention(user)
  emit('mention:select', user)
}

onChange((fileList) => {
  if (!(fileList && photoWallRef.value?.handleStart))
    return

  for (const file of fileList) {
    photoWallRef.value.handleStart(Object.assign(file, { uid: Date.now() }))
  }
})

function insertEmoji(emoji: EmojiItem) {
  if (!editor.value)
    return

  editor.value
    .chain()
    .insertContent({
      type: 'emoji',
      attrs: {
        emoji: emoji.emoji,
        width: emoji.width,
        height: emoji.height,
      },
    })
    .run()
}

function insertMention(user: ForumAPI.User) {
  if (!editor.value)
    return

  editor.value
    .chain()
    .focus()
    .insertContent({
      type: 'mention',
      attrs: {
        id: user.id,
        label: user.login,
        homepage: user.homepage,
      },
    })
    .run()
}

watch(markdownFormatImages, () => {
  if (!editor.value)
    return
  modelValue.value = editor.value.getText({ blockSeparator: '\n' }) + markdownFormatImages.value
})

watch(modelValue, (newValue) => {
  if (!editor.value)
    return

  const currentText = editor.value.getText({ blockSeparator: '\n' })
  if (newValue.replace(markdownFormatImages.value, '') !== currentText) {
    editor.value.commands.setContent(newValue)
  }
})

onBeforeUnmount(() => {
  if (editor.value)
    editor.value.destroy()
  if (stopClipboardListener.value)
    stopClipboardListener.value()
})

function initTextarea() {
  resetImageList()
}

function clearImages() {
  resetImageList()
}

function handleSubmit() {
  if (charCount.value === 0 || !isCompleted.value)
    return

  const content = JSON.stringify(editor.value?.getJSON()) + markdownFormatImages.value
  emit('submit', content)
}

watch(() => props.disabled, (newVal) => {
  if (editor.value)
    editor.value.setEditable(!newVal)
})

defineExpose({
  initTextarea,
  clearImages,
})
</script>

<template>
  <div ref="textarea-container" v-motion-slide-top class="flex" :class="cn('w-full flex', containerClass)">
    <div class="comment-area w-full">
      <div class="body relative">
        <div
          v-if="userAuth.isTokenValid || !loginRequired"
          class="h-fit min-h-48px w-full border border-color-[var(--vp-c-gutter)] rounded-md bg-[var(--vp-c-bg-soft)] px-2 pt-2 focus:border-style-solid focus:bg-transparent"
          :class="{ 'pb-2': hasSelectedFile }" @click="hideFooter = false"
        >
          <div v-if="toolbarPosition === 'inner'" class="absolute right-12px">
            <EmojiPicker v-if="features.includes('Emoji')" class="border-none" :reference="container" @select="handleEmojiSelect" />
          </div>

          <InputPlaceholders
            v-if="!isEditorFocused && imageList.length === 0" :text="text" class="pl-2" :placeholders="replyTarget
              ? [`${message.forum.comment.reply} @${replyTarget}:`] : placeholders"
          />
          <EditorContent
            class="editor h-auto min-h-32px w-full cursor-text bg-transparent font-size-3.5 line-height-[32px]"
            :editor="editor"
          />

          <ForumImageUpload
            v-if="features.includes('Upload')" ref="photoWallRef"
            v-model="imageList" size="xl" :file-limit="uploadLimit" :max-file-size="fileSizeLimit" :accept="accept"
            :auto-upload="true" :multiple="true" :hide-default-trigger="!showUploadDefaultTrigger"
            :class="{ hidden: !hasSelectedFile }"
            @upload="upload"
          />

          <div
            v-if="showCharacterCounter"
            class="character-count absolute bottom-0 right-0 flex scale-80 items-center font-size-sm"
            :class="{ 'character-count--warning': charCount === maxTextLength }"
          >
            <svg height="20" width="20" viewBox="0 0 20 20" class="mr-6px">
              <circle r="10" cx="10" cy="10" fill="#e9ecef" />
              <circle
                r="5" cx="10" cy="10" fill="transparent" stroke="currentColor" stroke-width="10"
                :stroke-dasharray="`calc(${percentage} * 31.4 / 100) 31.4`" transform="rotate(-90) translate(-20)"
              />
              <circle r="6" cx="10" cy="10" fill="white" />
            </svg>

            {{ charCount }} / {{ maxTextLength }}
          </div>
        </div>
        <div
          v-else
          class="h-8 h-auto min-h-48px w-full cursor-text rounded-md bg-[var(--vp-c-bg-soft)] p-2 text-center font-size-3.5 line-height-[32px]"
        >
          <DynamicTextReplacer
            :data="message.forum.comment.commentAfterLogin"
            class="important:m-0 important:line-height-[32px]"
          >
            <template #login>
              <a class="vp-link" href="#login-alert">
                [{{ message.forum.auth.login }}]
              </a>
            </template>
          </DynamicTextReplacer>
        </div>
      </div>
      <div
        v-if="userAuth.isTokenValid && features.length !== 0 && toolbarPosition === 'bottom'" v-show="!collapse || !hideFooter" v-motion-slide-top
        class="footer mt-2.5 w-full flex items-center justify-between"
      >
        <div class="tool">
          <EmojiPicker v-if="features.includes('Emoji')" :reference="container" @select="handleEmojiSelect" />

          <MentionPicker v-if="features.includes('Mention')" v-model:open="showMentionPicker" class="ml-2" @select="handleMentionSelect" />

          <Button
            v-if="features.includes('Upload')" variant="ghost" class="ml-2 h-8 w-6 border border-[var(--vp-c-gutter)] border-solid bg-transparent"
            @click="open"
          >
            <span class="i-lucide:image icon-btn size-4 c-[var(--vp-c-text-2)]" />
          </Button>
        </div>

        <div v-if="features.includes('Submit')" class="btn flex">
          <Button :disabled="charCount === 0 || !isCompleted" @click="handleSubmit">
            <ReloadIcon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ message.ui.button.submit }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
textarea {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

textarea::-webkit-scrollbar {
  display: none;
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
