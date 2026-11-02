import { describe, expect, test } from 'vitest'
import { retroDither } from '../../src/utils/retroDither'

describe('retroDither', () => {
  test('distributes intermediate luminance across the Bayer tile and preserves alpha', () => {
    const pixels = new Uint8ClampedArray(Array.from({ length: 16 }, () => [128, 128, 128, 73]).flat())
    retroDither(pixels, 4, { levels: 1, contrast: 1, colorize: 1 })
    const values = Array.from({ length: 16 }, (_, i) => pixels[i * 4])
    expect(values.filter(value => value === 255)).toHaveLength(8)
    expect(values.filter(value => value === 0)).toHaveLength(8)
    expect(Array.from({ length: 16 }, (_, i) => pixels[i * 4 + 3])).toEqual(Array.from({ length: 16 }).fill(73))
  })

  test('keeps black and white stable and retains source hue', () => {
    const edges = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255])
    retroDither(edges, 2, { contrast: 1 })
    expect(Array.from(edges)).toEqual([0, 0, 0, 255, 255, 255, 255, 255])
    const red = new Uint8ClampedArray([180, 0, 0, 255])
    retroDither(red, 1, { colorize: 0 })
    expect(red[0]).toBeGreaterThan(0)
    expect(red[1]).toBe(0)
    expect(red[2]).toBe(0)
  })
})
