<script setup lang="ts">
import type { EmojiItem } from '@/components/ui/EmojiPicker.vue'
import { Button } from '@/components/ui/button'
import EmojiPicker from '@/components/ui/EmojiPicker.vue'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useLocalized } from '@/hooks/useLocalized'
import { useFileDialog } from '@vueuse/core'
import { watch } from 'vue'

interface Props {
  features: string[]
  uploadLimit?: number
  fileSizeLimit?: number
  accept?: string[]
  loading?: boolean
  disabled?: boolean
  showUploadTrigger?: boolean
}

interface Emits {
  (e: 'emoji-select', emoji: EmojiItem): void
  (e: 'upload-files', files: File[]): void
  (e: 'submit'): void
}

const props = withDefaults(defineProps<Props>(), {
  uploadLimit: 5,
  fileSizeLimit: 5, // MB
  accept: () => ['image/*'],
  showUploadTrigger: true,
})

const emit = defineEmits<Emits>()
const { message } = useLocalized()

// File upload
const { open: openFileDialog, files } = useFileDialog({
  multiple: true,
  accept: props.accept.join(','),
})

const hasFeature = (feature: string) => props.features.includes(feature)

// Watchers
watch(files, (newFiles) => {
  if (newFiles?.length) {
    emit('upload-files', Array.from(newFiles))
  }
})

// Event handlers
function handleEmojiSelect(emoji: EmojiItem): void {
  emit('emoji-select', emoji)
}

function handleUploadClick(): void {
  openFileDialog()
}

function handleSubmit(): void {
  emit('submit')
}
</script>

<template>
  <div class="rich-text-toolbar flex items-center gap-2 p-2">
    <!-- Emoji Picker -->
    <Popover v-if="hasFeature('Emoji')">
      <PopoverTrigger as-child>
        <Button
          variant="ghost"
          size="sm"
          class="h-8 w-8 p-0"
          :disabled="disabled"
        >
          <span class="i-lucide-smile text-base" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-80 p-0">
        <EmojiPicker @emoji-click="handleEmojiSelect" />
      </PopoverContent>
    </Popover>

    <!-- File Upload -->
    <Button
      v-if="hasFeature('Upload') && showUploadTrigger"
      variant="ghost"
      size="sm"
      class="h-8 w-8 p-0"
      :disabled="disabled"
      @click="handleUploadClick"
    >
      <span class="i-lucide-image text-base" />
    </Button>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Submit Button -->
    <Button
      v-if="hasFeature('Submit')"
      size="sm"
      :disabled="disabled || loading"
      @click="handleSubmit"
    >
      <ReloadIcon v-if="loading" class="mr-1 h-3 w-3 animate-spin" />
      {{ message.ui.button.submit }}
    </Button>
  </div>
</template>

<style scoped>
.rich-text-toolbar {
  border-top: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg-soft);
}
</style>
