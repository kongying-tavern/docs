// Adapted from Canvas UI's Retro Dither shader: https://canvasui.dev/docs/components/retro-dither
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

export interface RetroDitherOptions {
  levels?: number
  contrast?: number
  brightness?: number
  colorize?: number
}

/** Apply ordered luminance dithering in place, preserving hue and alpha. */
export function retroDither(data: Uint8ClampedArray, width: number, options: RetroDitherOptions = {}): void {
  const levels = Math.max(1, Math.round(options.levels ?? 4))
  const contrast = options.contrast ?? 0.6
  const brightness = options.brightness ?? 0
  const colorize = Math.max(0, Math.min(1, options.colorize ?? 0.1))
  for (let i = 0; i < data.length; i += 4) {
    const pixel = i / 4
    const x = pixel % width
    const y = Math.floor(pixel / width)
    const luminance = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
    const lum = Math.max(0, Math.min(1, (luminance - 0.5) * contrast + 0.5 + brightness))
    const value = lum * levels
    const threshold = (BAYER[(y % 4) * 4 + x % 4] + 0.5) / 16
    const quantized = (Math.floor(value) + (value % 1 >= threshold ? 1 : 0)) / levels
    for (let channel = 0; channel < 3; channel++) {
      const hue = data[i + channel] * quantized / Math.max(lum, 0.001)
      data[i + channel] = hue * (1 - colorize) + quantized * 255 * colorize
    }
  }
}
