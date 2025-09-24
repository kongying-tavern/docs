<script setup lang="ts">
import type { UploadFile } from '@/components/ui/photo-wall/upload'
import type { HTMLAttributes } from 'vue'
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { EditorContent } from '@tiptap/vue-3'
import { useImageUpload } from '~/composables/useImageUpload'
import { useRichTextareaState } from './composables/useRichTextareaState'
import ForumCharacterCounter from './ForumCharacterCounter.vue'
import ForumImageUpload from './ForumImageUpload.vue'
import ForumRichTextToolbar from './ForumRichTextToolbar.vue'

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
  (e: 'submit', data: { content: string, images?: UploadFile[] }): void
  (e: 'focus'): void
  (e: 'blur'): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholders: () => ['写下你的想法...', '分享你的经验...', '提出你的问题...'],
  replyTarget: '',
  collapse: true,
  maxTextLength: 2000,
  disabled: false,
  loginRequired: true,
  features: () => ['Upload', 'Emoji', 'Mention', 'Submit'],
  uploadLimit: 5,
  fileSizeLimit: 5,
  accept: () => ['image/*'],
  toolbarPosition: 'inner',
  loading: false,
  showCharacterCounter: true,
  autoHideFooter: true,
  showUploadDefaultTrigger: true,
  modelValue: '',
})

const emit = defineEmits<Emits>()

// Composables
const { message } = useLocalized()
const userAuth = useUserAuthStore()

// Rich textarea state management
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
  isExpanded,
  editorContainer,
  placeholder,
  shouldShowFooter,
  hasFeature,
  canSubmit,
  handleFocus,
  handleBlur,
  handleEmojiSelect,
  handleUploadFiles,
  handleSubmit,
  shouldShowAuthPrompt,
} = useRichTextareaState(props, emit)

// Image upload functionality
const { imageList } = useImageUpload()
</script>

<template>
  <div
    ref="editorContainer"
    :class="cn(
      'rich-textarea-container rounded-lg border transition-all',
      isExpanded ? 'border-blue-300 shadow-sm' : 'border-gray-300',
      props.containerClass,
    )"
  >
    <!-- Auth prompt -->
    <div v-if="shouldShowAuthPrompt" class="flex items-center justify-center p-6">
      <DynamicTextReplacer
        :text="message.ui.loginRequired"
        class="text-sm text-gray-600"
      />
    </div>

    <!-- Editor content -->
    <template v-else>
      <div class="relative">
        <EditorContent
          :editor="editor"
          :class="cn(
            'rich-textarea-content min-h-[100px] p-3 prose prose-sm max-w-none',
            props.class,
          )"
          @focus="handleFocus"
          @blur="handleBlur"
        />

        <!-- Placeholder -->
        <div
          v-if="isEmpty && isReady"
          class="pointer-events-none absolute left-3 top-3 text-sm text-gray-400"
        >
          {{ placeholder }}
        </div>
      </div>

      <!-- Image Upload Area -->
      <div v-if="hasFeature('Upload') && imageList.length > 0" class="p-3 pt-0">
        <ForumImageUpload
          v-model="imageList"
          :max-file-size="fileSizeLimit"
          :file-limit="uploadLimit"
          :accept="accept"
          size="sm"
          @upload="upload"
        />
      </div>

      <!-- Footer -->
      <div v-if="shouldShowFooter" class="border-t border-gray-200">
        <!-- Toolbar -->
        <ForumRichTextToolbar
          v-if="props.toolbarPosition === 'inner'"
          :features="features"
          :upload-limit="uploadLimit"
          :file-size-limit="fileSizeLimit"
          :accept="accept"
          :loading="loading"
          :disabled="disabled"
          :show-upload-trigger="showUploadDefaultTrigger"
          @emoji-select="handleEmojiSelect"
          @upload-files="handleUploadFiles"
          @submit="handleSubmit"
        />

        <!-- Character Counter -->
        <ForumCharacterCounter
          v-if="showCharacterCounter"
          :current="characterCount"
          :limit="characterLimit"
        />
      </div>

      <!-- External Toolbar -->
      <ForumRichTextToolbar
        v-if="props.toolbarPosition === 'bottom' && shouldShowFooter"
        :features="features"
        :upload-limit="uploadLimit"
        :file-size-limit="fileSizeLimit"
        :accept="accept"
        :loading="loading"
        :disabled="disabled"
        :show-upload-trigger="showUploadDefaultTrigger"
        class="mt-2 border rounded-lg"
        @emoji-select="handleEmojiSelect"
        @upload-files="handleUploadFiles"
        @submit="handleSubmit"
      />
    </template>
  </div>
</template>

<style scoped>
.rich-textarea-container {
  background-color: var(--vp-c-bg);
  transition: all 0.2s ease;
}

.rich-textarea-container:focus-within {
  border-color: var(--vp-c-brand);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.rich-textarea-content :deep(.ProseMirror) {
  outline: none;
  padding: 0;
  min-height: 60px;
}

.rich-textarea-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--vp-c-text-3);
  pointer-events: none;
  height: 0;
}

.rich-textarea-content :deep(.mention) {
  background-color: var(--vp-c-brand-soft);
  border-radius: 0.375rem;
  padding: 0.125rem 0.375rem;
  color: var(--vp-c-brand);
  text-decoration: none;
}
</style>
