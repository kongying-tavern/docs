<template>
  <div class="flex">
    <div class="comment-area w-full">
      <div
        class="body border-style-solid border rounded-md px-2 py-1"
        :class="class"
      >
        <div class="editor">
          <textarea
            class="h-8 w-full min-h-68px max-h-200px h-auto line-height-[32px] cursor-text font-size-3.5 bg-transparent resize-none"
            ref="textarea"
            v-model.trim="input"
            :maxlength="textLimit"
            :placeholder="placeholder"
          >
          </textarea>
        </div>
        <PhotoWall
          v-model:file-list="modelValue.images"
          :limit="fileLimit"
          :accept="accent"
          :multiple="multiple"
          :hideDefaultTrigger="hideDefaultTrigger || false"
          :on-change="handleFileChange"
          default-state="uploading"
        >
          <span i-lucide-image-plus v-if="canAddImages" />
          <span i-lucide-image-off v-else />
          <template #tip v-if="fileLimit || uploadTips">
            <DynamicTextReplacer
              v-if="uploadTips"
              :data="uploadTips"
              tag="p"
              class="font-size-3 c-[var(--vp-c-text-2)]"
            >
              <template #range>
                <span>
                  {{ fileLimit }}
                </span>
              </template>
              <template v-if="maxFileSize" #size>
                <span>{{ maxFileSize }}</span>
              </template>
            </DynamicTextReplacer>
          </template>
        </PhotoWall>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTextareaAutosize, useVModel } from '@vueuse/core'
import { computed, nextTick, watch, type HTMLAttributes } from 'vue'
import { PhotoWall } from '@/components/ui/photo-wall'
import { uploadImg } from '@/apis/forum/imgs-upload'
import { useRequest } from 'vue-request'
import { toast } from 'vue-sonner'
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'
import type {
  UploadFile,
  UploadFiles,
  UploadStatus,
  UploadUserFile,
} from '@/components/ui/photo-wall/upload'
import { useLocalized } from '@/hooks/useLocalized'
// import { compressImage } from './utils'

interface Content {
  text: string
  images?: UploadUserFile[]
}

const props = defineProps<{
  modelValue: Content
  class?: HTMLAttributes['class']
  defaultValue?: Content
  placeholder?: string
  accent?: string
  multiple?: boolean
  textLimit?: number
  maxFileSize?: number
  fileLimit?: number
  autoUpload?: boolean
  uploadTips?: string
  hideDefaultTrigger?: boolean
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

const { message } = useLocalized()

const uploadedFiles = new Map<number, UploadFile>()
const canAddImages = computed(() => {
  return (props.modelValue.images?.length || 0) < (props.fileLimit || 0)
})

const { textarea, input } = useTextareaAutosize()
const { data, runAsync, loading, error } = useRequest(uploadImg, {
  manual: true,
})

const upload = async (uploadFile: UploadFile) => {
  if (!props.autoUpload || !uploadFile.raw) return

  if (
    props.maxFileSize &&
    uploadFile.raw.size > props.maxFileSize * 1024 * 1024
  ) {
    toast(
      `[${uploadFile.name}] File too large (${uploadFile.raw.size / 1024 / 1024}/${props.maxFileSize} MB)`,
    )
    uploadFile.status = 'fail'
    return
  }

  // 测试压缩 jpg 格式图片后会导致后端无法正常解析，原因未知
  // let [compressError, compressedFile] = await compressImage(uploadFile.raw)

  // console.info(compressedFile.size, uploadFile.raw.size)

  // if (compressError) console.error(`[${uploadFile.name}] ${compressError}`)

  await runAsync(uploadFile.raw, uploadFile.uid)

  await nextTick()

  if (data.value?.state && data.value?.data) {
    updateImage(uploadFile.uid, data.value.data.link, 'ready')
    uploadedFiles.set(uploadFile.uid, uploadFile)
  } else {
    updateImage(uploadFile.uid, undefined, 'fail')
    toast.error(`[${uploadFile.name}] ${data.value?.message}`)
  }
}

const uploadMultipleFiles = async (files: UploadFiles) => {
  const newFiles = files.filter((f) => !uploadedFiles.has(f.uid))
  await Promise.all(newFiles.map(upload))
}

const updateImage = (
  uid: number,
  url: string | undefined,
  status: UploadStatus,
) => {
  const index = props.modelValue.images?.findIndex((img) => img.uid === uid)
  if (index !== undefined && index >= 0) {
    props.modelValue.images![index].status = status
    if (url) props.modelValue.images![index].url = url
  }
}

const handleFileChange = async (file: UploadFile, files: UploadFiles) => {
  if (!props.multiple) return upload(file)

  uploadMultipleFiles(files)
}

watch(input, () => (modelValue.value.text = input.value))
watch(error, () => toast.error(message.value.forum.publish.form.upload.fail))
</script>

<style scoped>
textarea {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

textarea::-webkit-scrollbar {
  display: none;
}
</style>
