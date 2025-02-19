import { ref, computed, watch } from 'vue'
import { convertMultipleToMarkdown } from '~/components/forum/utils'

import type { UploadUserFile } from '@/components/ui/photo-wall/upload'

export function useImageUpload() {
  const uploadedImages = ref<UploadUserFile[]>([])
  const imageList = ref<UploadUserFile[]>([])

  const isUploading = computed(() => {
    return imageList.value?.some(
      (val: any) =>
        val.status === 'uploading' || val.url?.substring(3) === 'blob',
    )
  })

  const handleImageUpload = () => {
    imageList.value?.forEach((val) => {
      if (val.status === 'ready' && val.url?.substring(3) !== 'blob') {
        uploadedImages.value = [...uploadedImages.value, val]
      }
    })
  }

  const markdownFormatImages = computed(() => {
    console.log(uploadedImages.value, imageList.value)
    console.log(uploadedImages.value.map((image) => image.url))
    return convertMultipleToMarkdown(
      uploadedImages.value
        .map((image) => image.url)
        .filter((url): url is string => url !== undefined),
    )
  })

  const restImageList = () => {
    uploadedImages.value = []
    imageList.value = []
  }

  watch(imageList, handleImageUpload, { deep: true })

  return {
    isUploading,
    uploadedImages,
    handleImageUpload,
    markdownFormatImages,
    restImageList,
    imageList,
  }
}
