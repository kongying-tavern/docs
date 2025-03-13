import type { UploadFile, UploadStatus, UploadUserFile } from '@/components/ui/photo-wall/upload'
import type { ThumbHashCalculated } from '@/composables/calculateThumbHashForFile'
import { uploadImg } from '@/apis/inter-knot.site/upload'
import { calculateThumbHashForFile } from '@/composables/calculateThumbHashForFile'
import { computed, nextTick, ref } from 'vue'
import { useRequest } from 'vue-request'
import { toast } from 'vue-sonner'
import { convertMultipleToMarkdown } from '~/components/forum/utils'

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

  const { data, runAsync, error, loading } = useRequest(uploadImg, { manual: true })

  const isProcessing = ref(false)
  const imageList = ref<UploadUserFile[]>([])
  const canUploadMore = computed(() => imageList.value.length < fileLimit)
  const isUploading = computed(() => imageList.value.some(val => val.status === 'uploading'))
  const isCompleted = computed(() => !isUploading.value && !isProcessing.value && !loading.value)
  const uploadedImages = ref<UploadedUserFile[]>([])

  async function upload(uploadFile: UploadFile) {
    const _uploadFile = ensureUploadImage(uploadFile)
    if (!_uploadFile)
      return
    isProcessing.value = true

    await updateImage(uploadFile.uid, undefined, 'uploading')

    await runAsync(_uploadFile.raw)
    await nextTick()

    if (data.value?.state && data.value?.data) {
      await updateImage(uploadFile.uid, data.value.data.link, 'ready')
    }
    else {
      await updateImage(uploadFile.uid, undefined, 'fail')
      toast.error(`[${uploadFile.name}] ${error.value?.message || 'Upload failed'}`)
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

  const markdownFormatImages = computed(() => convertMultipleToMarkdown(uploadedImages.value))

  function resetImageList() {
    imageList.value = []
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
      catch (error) {
        toast.error(`[${imageList.value![index].name}] calculate thumb hash failed (${error})`)
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
