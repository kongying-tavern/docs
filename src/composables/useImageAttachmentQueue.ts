import type { ComputedRef, Ref } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import type { ThumbHashCalculated } from '@/composables/calculateThumbHashForFile'
import { computed, ref } from 'vue'
import { IMAGE_UPLOAD_POLICY } from '~/components/forum/constants'

export type ImageAttachmentStatus
  = | 'queued'
    | 'processing'
    | 'uploading'
    | 'uploaded'
    | 'failed'

export type ImageAttachmentErrorCode
  = | 'count-exceeded'
    | 'empty-file'
    | 'invalid-type'
    | 'size-exceeded'
    | 'preview-failed'
    | 'upload-failed'

export interface ImageAttachmentError {
  code: ImageAttachmentErrorCode
  fileName: string
  message: string
}

export interface ImageAttachment {
  id: string
  selectionIndex: number
  file: File
  previewUrl: string
  status: ImageAttachmentStatus
  thumbHash?: ThumbHashCalculated
  remote?: NonNullable<ForumAPI.Image['data']>
  error?: ImageAttachmentError
}

export type AddImageFilesResult
  = | { ok: true, attachments: ImageAttachment[] }
    | { ok: false, errors: ImageAttachmentError[] }

export type UploadImageAttachmentsResult
  = | { ok: true }
    | { ok: false, errors: ImageAttachmentError[] }

export type ImageUploadFunction = (
  file: File,
  options?: { signal?: AbortSignal },
) => Promise<ForumAPI.Image>

export interface ImageAttachmentQueueOptions {
  upload: ImageUploadFunction
  prepare?: (file: File) => Promise<ThumbHashCalculated | undefined>
  createPreviewUrl?: (file: File) => string
  revokePreviewUrl?: (url: string) => void
  createId?: () => string
}

let fallbackId = 0

function defaultCreateId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `forum-image-${Date.now()}-${fallbackId++}`
}

export function validateImageBatch(
  files: File[],
  currentCount = 0,
): ImageAttachmentError[] {
  if (currentCount + files.length > IMAGE_UPLOAD_POLICY.MAX_COUNT) {
    return [{
      code: 'count-exceeded',
      fileName: files[0]?.name || '',
      message: `A maximum of ${IMAGE_UPLOAD_POLICY.MAX_COUNT} images is allowed.`,
    }]
  }

  const errors: ImageAttachmentError[] = []
  for (const file of files) {
    if (file.size === 0) {
      errors.push({
        code: 'empty-file',
        fileName: file.name,
        message: `${file.name} is empty.`,
      })
    }
    else if (file.size > IMAGE_UPLOAD_POLICY.MAX_BYTES) {
      errors.push({
        code: 'size-exceeded',
        fileName: file.name,
        message: `${file.name} exceeds ${IMAGE_UPLOAD_POLICY.MAX_SIZE_LABEL}.`,
      })
    }

    if (!IMAGE_UPLOAD_POLICY.MIME_TYPES.includes(file.type as (typeof IMAGE_UPLOAD_POLICY.MIME_TYPES)[number])) {
      errors.push({
        code: 'invalid-type',
        fileName: file.name,
        message: `${file.name} has an unsupported image type.`,
      })
    }
  }

  return errors
}

export function serializeUploadedAttachments(attachments: ImageAttachment[]): ForumAPI.ImageInfo[] {
  return attachments
    .filter(attachment => attachment.status === 'uploaded' && attachment.remote)
    .toSorted((left, right) => left.selectionIndex - right.selectionIndex)
    .map(attachment => ({
      src: attachment.remote!.link,
      alt: attachment.file.name,
      ...(attachment.thumbHash
        ? {
            thumbHash: attachment.thumbHash.dataBase64,
            width: attachment.thumbHash.width,
            height: attachment.thumbHash.height,
          }
        : {}),
    }))
}

export function useImageAttachmentQueue(
  options: ImageAttachmentQueueOptions,
): {
  attachments: Ref<ImageAttachment[]>
  canSelect: ComputedRef<boolean>
  isBusy: ComputedRef<boolean>
  hasFailures: ComputedRef<boolean>
  addFiles: (files: File[]) => Promise<AddImageFilesResult>
  uploadPending: () => Promise<UploadImageAttachmentsResult>
  retry: (id: string) => Promise<UploadImageAttachmentsResult>
  remove: (id: string) => void
  reset: () => void
  serializedAttachments: ComputedRef<ForumAPI.ImageInfo[]>
} {
  const upload = options.upload
  const prepare = options.prepare ?? (async () => undefined)
  const createPreviewUrl = options.createPreviewUrl ?? (file => URL.createObjectURL(file))
  const revokePreviewUrl = options.revokePreviewUrl ?? (url => URL.revokeObjectURL(url))
  const createId = options.createId ?? defaultCreateId

  const attachments = ref<ImageAttachment[]>([])
  const controllers = new Map<string, AbortController>()
  let nextSelectionIndex = 0

  const canSelect = computed(() => attachments.value.length < IMAGE_UPLOAD_POLICY.MAX_COUNT)
  const isBusy = computed(() => attachments.value.some(item => item.status === 'processing' || item.status === 'uploading'))
  const hasFailures = computed(() => attachments.value.some(item => item.status === 'failed'))
  const serializedAttachments = computed(() => serializeUploadedAttachments(attachments.value))

  async function addFiles(files: File[]): Promise<AddImageFilesResult> {
    const errors = validateImageBatch(files, attachments.value.length)
    if (errors.length)
      return { ok: false, errors }
    if (!files.length)
      return { ok: true, attachments: [] }

    const created: ImageAttachment[] = []
    try {
      for (const file of files) {
        created.push({
          id: createId(),
          selectionIndex: nextSelectionIndex++,
          file,
          previewUrl: createPreviewUrl(file),
          status: 'processing',
        })
      }
    }
    catch {
      for (const item of created)
        revokePreviewUrl(item.previewUrl)
      return {
        ok: false,
        errors: [{
          code: 'preview-failed',
          fileName: files[created.length]?.name || '',
          message: 'The image preview could not be created.',
        }],
      }
    }

    attachments.value = [...attachments.value, ...created]
    await Promise.all(created.map(async (createdAttachment) => {
      let thumbHash: ThumbHashCalculated | undefined
      try {
        thumbHash = await prepare(createdAttachment.file)
      }
      catch {
        // Thumbhash metadata is optional; the selected file remains uploadable.
      }
      const current = attachments.value.find(item => item.id === createdAttachment.id)
      if (!current)
        return
      if (thumbHash)
        current.thumbHash = thumbHash
      current.status = 'queued'
    }))

    return {
      ok: true,
      attachments: created.filter(createdAttachment =>
        attachments.value.some(item => item.id === createdAttachment.id),
      ),
    }
  }

  async function uploadIds(ids: string[]): Promise<UploadImageAttachmentsResult> {
    await Promise.all(ids.map(async (id) => {
      const item = attachments.value.find(attachment => attachment.id === id)
      if (!item || item.status !== 'queued')
        return

      const controller = new AbortController()
      controllers.set(id, controller)
      item.status = 'uploading'
      item.error = undefined

      try {
        const result = await upload(item.file, { signal: controller.signal })
        const current = attachments.value.find(attachment => attachment.id === id)
        if (!current)
          return
        if (!result.state || !result.data)
          throw new Error(result.message || 'Image upload failed.')
        current.remote = result.data
        current.status = 'uploaded'
      }
      catch (error) {
        const current = attachments.value.find(attachment => attachment.id === id)
        if (!current)
          return
        current.status = 'failed'
        current.error = {
          code: 'upload-failed',
          fileName: current.file.name,
          message: error instanceof Error ? error.message : 'Image upload failed.',
        }
      }
      finally {
        controllers.delete(id)
      }
    }))

    const errors = attachments.value.flatMap(item => item.status === 'failed' && item.error ? [item.error] : [])
    return errors.length ? { ok: false, errors } : { ok: true }
  }

  async function uploadPending(): Promise<UploadImageAttachmentsResult> {
    return uploadIds(
      attachments.value
        .filter(item => item.status === 'queued')
        .map(item => item.id),
    )
  }

  async function retry(id: string): Promise<UploadImageAttachmentsResult> {
    const item = attachments.value.find(attachment => attachment.id === id)
    if (!item || item.status !== 'failed')
      return { ok: true }
    item.status = 'queued'
    item.error = undefined
    return uploadIds([id])
  }

  function remove(id: string): void {
    const index = attachments.value.findIndex(item => item.id === id)
    if (index < 0)
      return
    const [removed] = attachments.value.splice(index, 1)
    controllers.get(id)?.abort()
    controllers.delete(id)
    revokePreviewUrl(removed.previewUrl)
  }

  function reset(): void {
    for (const item of attachments.value) {
      controllers.get(item.id)?.abort()
      revokePreviewUrl(item.previewUrl)
    }
    controllers.clear()
    attachments.value = []
    nextSelectionIndex = 0
  }

  return {
    attachments,
    canSelect,
    isBusy,
    hasFailures,
    addFiles,
    uploadPending,
    retry,
    remove,
    reset,
    serializedAttachments,
  }
}
