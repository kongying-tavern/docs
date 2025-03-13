/* eslint-disable ts/ban-ts-comment */
import CanvasKitInit from 'canvaskit-wasm'
import { rgbaToThumbHash, thumbHashToDataURL } from 'thumbhash'
import { binaryToBase64 } from '../utils'

export interface ThumbHashCalculated {
  /**
   * The thumbhash data URL of the image. Will be used to render as
   * `src` attribute in the HTML.
   */
  dataUrl: string
  /**
   * The thumbhash data base64 of the image. Will be used to render as
   * `data-thumbhash` attribute in the HTML.
   */
  dataBase64: string
  /**
   * The resized width of the image (thumbhash requires the image to be
   * resized to less than 100px in width or height).
   */
  width: number
  /**
   * The original width of the image.
   */
  originalWidth: number
  /**
   * The resized height of the image (thumbhash requires the image to
   * be resized to less than 100px in width or height).
   */
  height: number
  /**
   * The original height of the image.
   */
  originalHeight: number
}

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
 * @param {Uint8Array} imageData - The image data to be calculated
 * @returns {Promise<Omit<ThumbHash, 'fileName' | 'assetUrl' | 'assetUrlWithBase'>>} - The thumbhash data of the image
 */
export async function calculateThumbHashForFile(
  imageData: Uint8Array,
): Promise<ThumbHashCalculated> {
  const canvasKit = await CanvasKitInit({
    locateFile: file => `https://unpkg.com/canvaskit-wasm@latest/bin/${file}`,
  })
  const image = canvasKit.MakeImageFromEncoded(imageData)
  if (!image)
    throw new Error('Failed to make image from encoded data.')

  const width = image.width()
  const height = image.height()

  const scale = 100 / Math.max(width, height)
  const resizedWidth = Math.round(width * scale)
  const resizedHeight = Math.round(height * scale)

  // Paint the image to the canvas.
  const canvas = canvasKit.MakeCanvas(resizedWidth, resizedHeight)
  const context = canvas.getContext('2d')!
  // @ts-ignore
  context.drawImage(
    image as unknown as CanvasImageSource,
    0,
    0,
    resizedWidth,
    resizedHeight,
  )
  // Retrieve back the image data for thumbhash calculation as the
  // form of RGBA matrix.
  // @ts-ignore
  const pixels = context.getImageData(0, 0, resizedWidth, resizedHeight)

  // Easy calculation of thumbhash data.
  const thumbHashBinary = rgbaToThumbHash(
    pixels.width,
    pixels.height,
    pixels.data,
  )
  // Encode the thumbhash data to base64 and data URL.
  const thumbHashBase64 = binaryToBase64(thumbHashBinary)
  const thumbHashDataURL = await thumbHashToDataURL(thumbHashBinary)

  return {
    dataBase64: thumbHashBase64,
    dataUrl: thumbHashDataURL,
    width: resizedWidth,
    height: resizedHeight,
    originalWidth: width,
    originalHeight: height,
  }
}
