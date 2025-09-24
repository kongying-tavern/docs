import type { UploadRawFile } from '@/components/ui/photo-wall/upload'
import { genFileId } from '@/components/ui/photo-wall/upload'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

interface MessageValue {
  forum?: {
    publish?: {
      form?: {
        upload?: {
          paste?: {
            formatError?: string
            sizeExceed?: string
            formatNotSupported?: string
            limitExceed?: string
            processingError?: string
            clipboardError?: string
            dragDropError?: string
          }
        }
      }
    }
  }
}

export interface ClipboardPasteOptions {
  accept?: string[]
  maxFileSize?: number
  onPaste?: (files: File[]) => void
  enabledTypes?: ('image' | 'text')[]
  message?: { value: MessageValue }
  uploadLimit?: number
  currentUploadCount?: () => number
}

export function useClipboardPaste(options: ClipboardPasteOptions = {}) {
  const {
    accept = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
    maxFileSize = 3 * 1024 * 1024, // 3MB
    onPaste,
    enabledTypes = ['image'],
    message,
    uploadLimit = 3,
    currentUploadCount,
  } = options

  const isSupported = ref(typeof window !== 'undefined')
  const isListening = ref(false)
  const isDragOver = ref(false)
  const dragCounter = ref(0)

  function validateImageFile(file: File): boolean {
    if (!accept.includes(file.type)) {
      const errorText = message?.value?.forum?.publish?.form?.upload?.paste?.formatError
        ? message.value.forum.publish.form.upload.paste.formatError.replace('%format', file.type)
        : `不支持的图片格式: ${file.type}`
      toast.error(errorText)
      return false
    }

    if (file.size > maxFileSize) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2)
      const maxSizeMB = (maxFileSize / 1024 / 1024).toFixed(0)
      const errorText = message?.value?.forum?.publish?.form?.upload?.paste?.sizeExceed
        ? message.value.forum.publish.form.upload.paste.sizeExceed
            .replace('%size', sizeMB)
            .replace('%maxSize', maxSizeMB)
        : `图片大小 ${sizeMB}MB 超出限制 ${maxSizeMB}MB`
      toast.error(errorText)
      return false
    }

    return true
  }

  function checkUploadLimit(additionalFiles: number): boolean {
    const current = currentUploadCount?.() || 0
    if (current + additionalFiles > uploadLimit) {
      const errorText = message?.value?.forum?.publish?.form?.upload?.paste?.limitExceed
        ? message.value.forum.publish.form.upload.paste.limitExceed
            .replace('%current', current.toString())
            .replace('%limit', uploadLimit.toString())
        : `上传文件数量 ${current + additionalFiles} 超出限制 ${uploadLimit}`
      toast.error(errorText)
      return false
    }
    return true
  }

  async function handleClipboardPaste(event: ClipboardEvent): Promise<void> {
    try {
      if (!event.clipboardData)
        return

      const validFiles: File[] = []

      // Prefer clipboard items (modern approach) over direct files to avoid duplicates
      if (event.clipboardData.items && event.clipboardData.items.length > 0) {
        const items = Array.from(event.clipboardData.items)

        for (const item of items) {
          if (enabledTypes.includes('image') && item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (file && validateImageFile(file)) {
              validFiles.push(file)
            }
          }
        }
      }
      // Only fall back to files if no items were processed
      else if (event.clipboardData.files && event.clipboardData.files.length > 0) {
        const files = Array.from(event.clipboardData.files)

        for (const file of files) {
          if (enabledTypes.includes('image') && file.type.startsWith('image/')) {
            if (validateImageFile(file)) {
              validFiles.push(file)
            }
          }
        }
      }

      if (validFiles.length > 0 && checkUploadLimit(validFiles.length)) {
        onPaste?.(validFiles)
      }
      else if (event.clipboardData?.items?.length > 0) {
        // Show hint if clipboard has items but no valid images
        const hasImages = Array.from(event.clipboardData.items).some(item => item.type.startsWith('image/'))
        if (hasImages) {
          const hintText = message?.value?.forum?.publish?.form?.upload?.paste?.formatNotSupported
            || '剪贴板中的图片格式不受支持'
          toast.info(hintText)
        }
      }
    }
    catch (error) {
      console.error('Error handling clipboard paste:', error)
      const errorText = message?.value?.forum?.publish?.form?.upload?.paste?.clipboardError
        || '处理剪贴板内容时出错'
      toast.error(errorText)
    }
  }

  function handleDragEnter(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.value++
    if (dragCounter.value === 1) {
      isDragOver.value = true
    }
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.value--
    if (dragCounter.value === 0) {
      isDragOver.value = false
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.value = 0
    isDragOver.value = false

    try {
      const files = Array.from(event.dataTransfer?.files || [])
      const validFiles: File[] = []

      for (const file of files) {
        if (enabledTypes.includes('image') && file.type.startsWith('image/')) {
          if (validateImageFile(file)) {
            validFiles.push(file)
          }
        }
      }

      if (validFiles.length > 0 && checkUploadLimit(validFiles.length)) {
        onPaste?.(validFiles)
      }
    }
    catch (error) {
      console.error('Error handling drag drop:', error)
      const errorText = message?.value?.forum?.publish?.form?.upload?.paste?.dragDropError
        || '处理拖放文件时出错'
      toast.error(errorText)
    }
  }

  function startListening(target?: HTMLElement): () => void {
    const element = target || document
    const handlePaste = (event: Event) => {
      handleClipboardPaste(event as ClipboardEvent)
    }

    // Add both paste and drag/drop event listeners
    element.addEventListener('paste', handlePaste as EventListener)
    element.addEventListener('dragenter', handleDragEnter as EventListener)
    element.addEventListener('dragleave', handleDragLeave as EventListener)
    element.addEventListener('dragover', handleDragOver as EventListener)
    element.addEventListener('drop', handleDrop as EventListener)

    isListening.value = true

    return () => {
      element.removeEventListener('paste', handlePaste as EventListener)
      element.removeEventListener('dragenter', handleDragEnter as EventListener)
      element.removeEventListener('dragleave', handleDragLeave as EventListener)
      element.removeEventListener('dragover', handleDragOver as EventListener)
      element.removeEventListener('drop', handleDrop as EventListener)
      isListening.value = false
      isDragOver.value = false
      dragCounter.value = 0
    }
  }

  function createUploadRawFile(file: File): UploadRawFile {
    // Generate a proper filename for clipboard images
    let fileName = file.name
    if (!fileName || fileName === 'blob' || fileName === 'image.png') {
      const timestamp = Date.now()
      const extension = file.type.split('/')[1] || 'png'
      fileName = `clipboard-image-${timestamp}.${extension}`
    }

    // Create a new File object with the correct name if needed
    let processedFile: File = file
    if (fileName !== file.name) {
      processedFile = new File([file], fileName, {
        type: file.type,
        lastModified: file.lastModified,
      })
    }

    // Create UploadRawFile the same way as UploadPhoto.vue does
    const rawFile = processedFile as UploadRawFile
    rawFile.uid = genFileId()
    return rawFile
  }

  return {
    isSupported,
    isListening,
    isDragOver,
    handleClipboardPaste,
    startListening,
    createUploadRawFile,
  }
}
