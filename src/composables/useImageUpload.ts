import type { UploadFile, UploadStatus, UploadUserFile } from '@/components/ui/photo-wall/upload'
import type { ThumbHashCalculated } from '@/composables/calculateThumbHashForFile'
import { useMutation } from '@pinia/colada'
import { computed, nextTick, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { uploadImg } from '@/apis/interknot.site/upload'
import { calculateThumbHashForFile } from '@/composables/calculateThumbHashForFile'
import { formatMarkdownImages } from '~/components/forum/utils/formatting'

export interface UploadedUserFile extends UploadUserFile {
  thumbHash?: ThumbHashCalculated
  alt?: string
}

export function useImageUpload(options = {
  maximumSingleFileSize: 3,
  fileLimit: 3,
  fileAccept: ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'],
}) {
  const { maximumSingleFileSize, fileLimit, fileAccept } = options

  const isProcessing = ref(false)
  const imageList = ref<UploadUserFile[]>([])
  const canUploadMore = computed(() => imageList.value.length < fileLimit)
  const isUploading = computed(() => imageList.value.some(val => val.status === 'uploading'))
  const uploadedImages = ref<UploadedUserFile[]>([])

  const { mutateAsync: runUpload, isLoading } = useMutation({
    mutation: uploadImg,
  })

  const isCompleted = computed(() => !isUploading.value && !isProcessing.value && !isLoading.value)

  watch(imageList, (newList) => {
    if (isProcessing.value && !newList.some(file => file.status === 'uploading')) {
      isProcessing.value = false
    }
  }, { deep: true })

  async function upload(uploadFile: UploadFile) {
    const _uploadFile = ensureUploadImage(uploadFile)
    if (!_uploadFile)
      return
    isProcessing.value = true

    await updateImage(uploadFile.uid, undefined, 'uploading')

    try {
      // 使用 mutateAsync 的返回值，而不是共享的 data.value
      const result = await runUpload(_uploadFile.raw)
      await nextTick()

      if (result?.state && result?.data) {
        await updateImage(uploadFile.uid, result.data.link, 'ready')
      }
      else {
        await updateImage(uploadFile.uid, undefined, 'fail')
        toast.error(`[${uploadFile.name}] Upload failed`)
      }
    }
    catch (err) {
      await updateImage(uploadFile.uid, undefined, 'fail')
      toast.error(`[${uploadFile.name}] ${err instanceof Error ? err.message : 'Upload failed'}`)
    }

    isProcessing.value = false
  }

  function ensureUploadImage(uploadFile: UploadFile): Required<UploadFile> | false {
    if (!canUploadMore.value) {
      toast.error(`[Upload Failed] Maximum of ${fileLimit} images allowed`)
      return false
    }
    if (!uploadFile.raw?.size) {
      toast.error(`[Upload Failed] ${uploadFile.name} is not a valid image`)
      return false
    }
    if (uploadFile.raw.size > maximumSingleFileSize * 1024 * 1024) {
      toast.error(`[Upload Failed] ${uploadFile.name} (${(uploadFile.raw.size / 1024 / 1024).toFixed(2)}MB) exceeds ${maximumSingleFileSize}MB limit`)
      return false
    }

    if (!fileAccept.includes(uploadFile.raw!.type)) {
      toast.error(`[Upload Failed] ${uploadFile.name} (${uploadFile.raw!.type}) format not allowed`)
      return false
    }
    return { ...uploadFile, size: uploadFile.size ?? uploadFile.raw.size } as Required<UploadFile>
  }

  const markdownFormatImages = computed(() => formatMarkdownImages(uploadedImages.value))

  function resetImageList() {
    imageList.value = []
    uploadedImages.value = []
  }

  async function updateImage(
    uid: number,
    url: string | undefined,
    status: UploadStatus,
  ) {
    const index = imageList.value.findIndex(img => img.uid === uid)
    if (index !== undefined && index >= 0) {
      imageList.value![index].status = status
      if (url)
        imageList.value[index].url = url
    }

    if (status === 'ready' && !imageList.value![index].url?.startsWith('blob')) {
      let thumbHash: ThumbHashCalculated | undefined

      imageList.value![index].status = 'uploading'

      try {
        thumbHash = await calculateThumbHashForFile(new Uint8Array(await imageList.value![index].raw!.arrayBuffer()))
      }
      catch (err) {
        toast.error(`[${imageList.value![index].name}] calculate thumb hash failed (${err})`)
      }

      imageList.value![index].status = 'success'

      uploadedImages.value.push({
        ...imageList.value![index],
        alt: imageList.value![index].name,
        status: imageList.value![index].status,
        ...(thumbHash ? { thumbHash } : {}),
      })
    }
  }

  return {
    isUploading,
    uploadedImages,
    markdownFormatImages,
    resetImageList,
    canUploadMore,
    imageList,
    upload,
    isProcessing,
    isCompleted,
  }
}
