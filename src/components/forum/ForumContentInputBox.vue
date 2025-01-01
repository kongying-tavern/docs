<template>
  <div class="flex">
    <div class="comment-area w-full">
      <div
        class="body border-color-[var(--vp-c-gutter)] border-style-solid border rounded-md p-2"
      >
        <div class="editor">
          <textarea
            class="h-8 w-full min-h-48px max-h-200px h-auto line-height-[32px] cursor-text font-size-3.5 bg-transparent resize-none"
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
import { compressImage } from './utils'

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
  (e: 'on-progress', loading: boolean): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

const uploadedFiles = new Map<number, UploadFile>()
const canAddImages = computed(() => {
  return (props.modelValue.images?.length || 0) < (props.fileLimit || 0)
})

const { textarea, input } = useTextareaAutosize()

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

  const { data, runAsync, loading, error } = useRequest(uploadImg, {
    manual: true,
  })

  let [compressError, compressedFile] = await compressImage(uploadFile.raw)

  console.info(compressedFile.size, uploadFile.raw.size)

  if (compressError) console.error(`[${uploadFile.name}] ${compressError}`)

  await runAsync(compressedFile, uploadFile.raw.type)

  await nextTick()

  if (data.value) {
    updateImage(uploadFile.uid, data.value?.link, 'ready')
    uploadedFiles.set(uploadFile.uid, uploadFile)
  }

  watch(error, () => {
    updateImage(uploadFile.uid, undefined, 'fail')
    toast.error(`[${uploadFile.name}] 上传失败`)
  })

  watch(
    loading,
    () => {
      console.log(loading)
      emits('on-progress', loading.value)
    },
    {
      immediate: true,
    },
  )
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

  const uploadFiles = files.filter((f) => !uploadedFiles.has(f.uid))

  uploadFiles.forEach((f) => {
    upload(f)
  })
}

watch(input, () => (modelValue.value.text = input.value))
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
