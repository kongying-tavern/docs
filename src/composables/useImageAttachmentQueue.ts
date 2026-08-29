import type { ComputedRef, Ref } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import type { ThumbHashCalculated } from '@/composables/calculateThumbHashForFile'
import type {
  AddImageFilesResult,
  ImageAttachment,
  ImageUploadProgress,
  UploadImageAttachmentsResult,
} from '~/services/forum/form/imageAttachment'
import { computed, ref } from 'vue'
import { serializeUploadedAttachments, validateImageBatch } from '~/services/forum/form/imageAttachment'
import { IMAGE_UPLOAD_POLICY } from '~/services/forum/forumConfig'

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

export function useImageAttachmentQueue(
  options: ImageAttachmentQueueOptions,
): {
  attachments: Ref<ImageAttachment[]>
  canSelect: ComputedRef<boolean>
  isBusy: ComputedRef<boolean>
  hasFailures: ComputedRef<boolean>
  progress: ComputedRef<ImageUploadProgress>
  addFiles: (files: File[]) => Promise<AddImageFilesResult>
  settleUploads: () => Promise<UploadImageAttachmentsResult>
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
  const tasks = new Map<string, Promise<void>>()
  let nextSelectionIndex = 0

  const canSelect = computed(() => attachments.value.length < IMAGE_UPLOAD_POLICY.MAX_COUNT)
  const isBusy = computed(() => attachments.value.some(item => item.status === 'processing' || item.status === 'uploading'))
  const hasFailures = computed(() => attachments.value.some(item => item.status === 'failed'))
  const progress = computed<ImageUploadProgress>(() => ({
    total: attachments.value.length,
    settled: attachments.value.filter(item => item.status === 'uploaded' || item.status === 'failed').length,
    failed: attachments.value.filter(item => item.status === 'failed').length,
    uploading: attachments.value.filter(item => item.status === 'processing' || item.status === 'uploading').length,
  }))
  const serializedAttachments = computed(() => serializeUploadedAttachments(attachments.value))

  function startTask(id: string): Promise<void> {
    const existing = tasks.get(id)
    if (existing)
      return existing

    const task = prepareAndUpload(id)
      .catch(() => {
        // prepareAndUpload converts visible failures into attachment state.
      })
      .finally(() => {
        tasks.delete(id)
      })
    tasks.set(id, task)
    return task
  }

  async function prepareAndUpload(id: string): Promise<void> {
    const initial = attachments.value.find(attachment => attachment.id === id)
    if (!initial || !['processing', 'queued'].includes(initial.status))
      return

    if (!initial.thumbHash) {
      try {
        const thumbHash = await prepare(initial.file)
        const current = attachments.value.find(attachment => attachment.id === id)
        if (current && thumbHash)
          current.thumbHash = thumbHash
      }
      catch {
        // Thumbhash metadata is optional; the selected file remains uploadable.
      }
    }

    const item = attachments.value.find(attachment => attachment.id === id)
    if (!item)
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
    catch {
      const current = attachments.value.find(attachment => attachment.id === id)
      if (!current)
        return
      current.status = 'failed'
      current.error = {
        code: 'upload-failed',
        fileName: current.file.name,
      }
    }
    finally {
      controllers.delete(id)
    }
  }

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
        }],
      }
    }

    attachments.value = [...attachments.value, ...created]
    for (const item of created)
      void startTask(item.id)

    return {
      ok: true,
      attachments: created.filter(createdAttachment =>
        attachments.value.some(item => item.id === createdAttachment.id),
      ),
    }
  }

  async function settleUploads(): Promise<UploadImageAttachmentsResult> {
    for (const item of attachments.value) {
      if (item.status === 'queued' || item.status === 'processing')
        startTask(item.id)
    }
    await Promise.all([...tasks.values()])
    const errors = attachments.value.flatMap(item => item.status === 'failed' && item.error ? [item.error] : [])
    return errors.length ? { ok: false, errors } : { ok: true }
  }

  async function retry(id: string): Promise<UploadImageAttachmentsResult> {
    const item = attachments.value.find(attachment => attachment.id === id)
    if (!item || item.status !== 'failed')
      return { ok: true }
    item.status = 'queued'
    item.error = undefined
    await startTask(id)
    const settled = attachments.value.find(attachment => attachment.id === id)
    return settled?.status === 'failed' && settled.error
      ? { ok: false, errors: [settled.error] }
      : { ok: true }
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
    progress,
    addFiles,
    settleUploads,
    retry,
    remove,
    reset,
    serializedAttachments,
  }
}
