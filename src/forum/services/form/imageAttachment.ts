import type ForumAPI from '~/forum/api/types'
import { IMAGE_UPLOAD_POLICY } from '../forumConfig'

export interface ThumbHashCalculated {
  /** The image data URL used as an HTML src attribute. */
  dataUrl: string
  /** The image base64 used as a data-thumbhash attribute. */
  dataBase64: string
  /** Resized dimensions, less than 100px for thumbhash. */
  width: number
  height: number
  /** Original image dimensions. */
  originalWidth: number
  originalHeight: number
}

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
}

export interface ImageAttachment {
  id: string
  selectionIndex: number
  file?: File
  savedImage?: ForumAPI.ImageInfo
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

export interface ImageUploadProgress {
  total: number
  settled: number
  failed: number
  uploading: number
}

export function validateImageBatch(
  files: File[],
  currentCount = 0,
): ImageAttachmentError[] {
  if (currentCount + files.length > IMAGE_UPLOAD_POLICY.MAX_COUNT) {
    return [{
      code: 'count-exceeded',
      fileName: files[0]?.name || '',
    }]
  }

  const errors: ImageAttachmentError[] = []
  for (const file of files) {
    if (file.size === 0) {
      errors.push({
        code: 'empty-file',
        fileName: file.name,
      })
    }
    else if (file.size > IMAGE_UPLOAD_POLICY.MAX_BYTES) {
      errors.push({
        code: 'size-exceeded',
        fileName: file.name,
      })
    }

    if (!IMAGE_UPLOAD_POLICY.MIME_TYPES.includes(file.type as (typeof IMAGE_UPLOAD_POLICY.MIME_TYPES)[number])) {
      errors.push({
        code: 'invalid-type',
        fileName: file.name,
      })
    }
  }

  return errors
}

export function serializeUploadedAttachments(attachments: ImageAttachment[]): ForumAPI.ImageInfo[] {
  return attachments
    .filter(attachment => attachment.status === 'uploaded' && (attachment.remote || attachment.savedImage))
    .toSorted((left, right) => left.selectionIndex - right.selectionIndex)
    .map(attachment => attachment.savedImage
      ? { ...attachment.savedImage }
      : ({
          src: attachment.remote!.link,
          alt: attachment.file?.name || '',
          ...(attachment.thumbHash
            ? {
                thumbHash: attachment.thumbHash.dataBase64,
                width: attachment.thumbHash.originalWidth,
                height: attachment.thumbHash.originalHeight,
              }
            : {}),
        }))
}
