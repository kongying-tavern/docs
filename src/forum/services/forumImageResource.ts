import type ForumAPI from '~/forum/api/types'
import ky from 'ky'

export interface ForumImageResource extends ForumAPI.ImageInfo {
  originalSrc?: string
  thumbhash?: string
  fileName?: string
  naturalWidth?: number
  naturalHeight?: number
  declaredWidth?: number
  declaredHeight?: number
}

export function imageFileName(image: ForumImageResource): string {
  try {
    // eslint-disable-next-line no-control-regex -- Save pickers reject control characters and path separators.
    return (image.fileName || decodeURIComponent(new URL(image.src, 'https://localhost').pathname.split('/').pop() || 'image')).replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_')
  }
  catch {
    return 'image'
  }
}

/** Convert only the clipboard representation; downloads retain the original bytes. */
export async function imageClipboardBlob(blob: Blob): Promise<Blob> {
  if (blob.type === 'image/png')
    return blob
  const bitmap = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d')
    if (!context)
      throw new Error('Canvas unavailable')
    context.drawImage(bitmap, 0, 0)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image conversion failed')), 'image/png'))
  }
  finally {
    bitmap.close()
  }
}

export async function fetchImageResource(src: string, signal?: AbortSignal) {
  const response = await ky.get(src, { signal, retry: 0 })
  const blob = await response.blob()
  return { blob, size: blob.size, type: blob.type, lastModified: response.headers.get('last-modified') }
}
