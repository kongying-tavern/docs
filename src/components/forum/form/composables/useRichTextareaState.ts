import type { UploadFile, UploadStatus } from '@/components/ui/photo-wall/upload'
import type { EmojiItem } from '@/components/ui/types'
import type { HTMLAttributes } from 'vue'
import { useAuthState } from '@/utils/auth-helpers'
import { onClickOutside } from '@vueuse/core'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useImageUpload } from '~/composables/useImageUpload'
import { useRichTextEditor } from './useRichTextEditor'

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

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'submit', data: { content: string, images?: unknown[] }): void
  (e: 'focus'): void
  (e: 'blur'): void
}

export function useRichTextareaState(props: Props, emit: Emits) {
  const { isLoggedIn } = useAuthState()

  // Reactive state
  const content = ref(props.modelValue || '')
  const isExpanded = ref(!props.collapse)
  const editorContainer = useTemplateRef<HTMLElement>('editorContainer')

  // Rich text editor
  const {
    editor,
    isReady,
    editorContent,
    isEmpty,
    isValid,
    characterCount,
    characterLimit,
    isOverLimit,
    focusEditor,
    insertEmoji,
    insertMention,
  } = useRichTextEditor({
    maxTextLength: props.maxTextLength || 2000,
    placeholder: Array.isArray(props.placeholders) ? props.placeholders[0] : (props.placeholders || ''),
    modelValue: content,
    replyTarget: props.replyTarget,
    disabled: props.disabled,
  })

  // Image upload
  const {
    imageList,
    isCompleted: imageUploadCompleted,
    upload,
    resetImageList,
  } = useImageUpload({
    maximumSingleFileSize: props.fileSizeLimit || 5,
    fileLimit: props.uploadLimit || 5,
    fileAccept: props.accept || ['image/*'],
  })

  // Computed properties
  const placeholder = computed(() => {
    if (Array.isArray(props.placeholders)) {
      const randomIndex = Math.floor(Math.random() * props.placeholders.length)
      return props.placeholders[randomIndex]
    }
    return props.placeholders || '写下你的想法...'
  })

  const canSubmit = computed(() =>
    isValid.value && imageUploadCompleted.value && !props.loading,
  )

  const shouldShowFooter = computed(() =>
    isExpanded.value || !props.autoHideFooter,
  )

  const shouldShowAuthPrompt = computed(() =>
    props.loginRequired && !isLoggedIn.value,
  )

  const hasFeature = (feature: SupportFeature) => (props.features || []).includes(feature)

  // Event handlers
  function handleFocus(): void {
    if (!props.loginRequired || isLoggedIn.value) {
      isExpanded.value = true
      emit('focus')
    }
  }

  function handleBlur(): void {
    if (props.autoHideFooter && isEmpty.value) {
      isExpanded.value = false
    }
    emit('blur')
  }

  function handleEmojiSelect(emoji: EmojiItem): void {
    insertEmoji(emoji.emoji)
  }

  // Convert File to UploadFile
  function createUploadFile(file: File): UploadFile {
    const uploadFile = Object.create(file)
    uploadFile.uid = `${Date.now()}-${Math.random().toString(36).substring(2)}`
    uploadFile.status = 'pending' as UploadStatus
    return uploadFile as UploadFile
  }

  function handleUploadFiles(files: File[]): void {
    files.forEach(file => upload(createUploadFile(file)))
  }

  function handleSubmit(): void {
    if (!canSubmit.value)
      return

    emit('submit', {
      content: editorContent.value,
      images: imageList.value,
    })

    // Reset after submit
    editorContent.value = ''
    resetImageList()

    if (props.autoHideFooter) {
      isExpanded.value = false
    }
  }

  // Click outside to collapse
  onClickOutside(editorContainer, () => {
    if (props.autoHideFooter && isEmpty.value) {
      isExpanded.value = false
    }
  })

  // Watch for prop changes
  watch(() => props.modelValue, (newValue) => {
    if (newValue !== content.value) {
      content.value = newValue || ''
    }
  })

  watch(content, (newContent) => {
    emit('update:modelValue', newContent)
  })

  return {
    // Editor state
    editor,
    isReady,
    editorContent,
    isEmpty,
    isValid,
    characterCount,
    characterLimit,
    isOverLimit,

    // Actions
    focusEditor,
    insertEmoji,
    insertMention,

    // UI state
    isExpanded,
    editorContainer,
    placeholder,
    shouldShowFooter,
    shouldShowAuthPrompt,

    // Helpers
    hasFeature,
    canSubmit,

    // Event handlers
    handleFocus,
    handleBlur,
    handleEmojiSelect,
    handleUploadFiles,
    handleSubmit,

    // Image state
    imageList,
  }
}
