import type { ThumbHashCalculated } from '~/forum/services/form/imageAttachment'
import { rgbaToThumbHash, thumbHashToDataURL } from 'thumbhash'
import { binaryToBase64 } from '@/utils'

export type { ThumbHashCalculated } from '~/forum/services/form/imageAttachment'

/**
 * Calculate the thumbhash data for the image.
 *
 * Referenced the following implementations:
 * thumbhash/examples/browser/index.html at main · evanw/thumbhash
 * https://github.com/evanw/thumbhash/blob/main/examples/browser/index.html
 *
 * And the following implementations:
 * vite-plugin-thumbhash/packages/core/index.ts at main · cijiugechu/vite-plugin-thumbhash
 * https://github.com/cijiugechu/vite-plugin-thumbhash/blob/main/packages/core/index.ts
 *
 * @param {Blob} imageFile - The image file to be calculated
 * @returns {Promise<Omit<ThumbHash, 'fileName' | 'assetUrl' | 'assetUrlWithBase'>>} - The thumbhash data of the image
 */
export async function calculateThumbHashForFile(
  imageFile: Blob,
): Promise<ThumbHashCalculated> {
  const image = await createImageBitmap(imageFile)
  try {
    const scale = 100 / Math.max(image.width, image.height)
    const width = Math.round(image.width * scale)
    const height = Math.round(image.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context)
      throw new Error('Canvas 2D is unavailable.')

    context.drawImage(image, 0, 0, width, height)
    const pixels = context.getImageData(0, 0, width, height)
    const thumbHashBinary = rgbaToThumbHash(width, height, pixels.data)

    return {
      dataBase64: binaryToBase64(thumbHashBinary),
      dataUrl: thumbHashToDataURL(thumbHashBinary),
      width,
      height,
      originalWidth: image.width,
      originalHeight: image.height,
    }
  }
  finally {
    image.close()
  }
}
