import type { UploadedUserFile } from '~/composables/useImageUpload'

export function formatMarkdownImages(uploadedImages: UploadedUserFile[]): string {
  if (!uploadedImages.length)
    return ''

  return `\n${uploadedImages
    .map(({ url, thumbHash, alt }) => {
      const thumbHashStr = thumbHash
        ? `{thumbhash:"${thumbHash.dataBase64}",width:"${thumbHash.width}",height:"${thumbHash.height}"}`
        : ''
      return `![${alt || 'Uploaded image'}](${url})${thumbHashStr}`
    })
    .join('\n')}`
}
