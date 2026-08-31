/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { calculateThumbHashForFile } from '../../.vitepress/theme/composables/calculateThumbHashForFile'

test('thumbhash preparation uses native image dimensions and releases the bitmap', async () => {
  const originalCreateImageBitmap = Object.getOwnPropertyDescriptor(globalThis, 'createImageBitmap')
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const file = new Blob(['image'])
  let closed = false

  const bitmap = {
    width: 400,
    height: 200,
    close: () => { closed = true },
  } as ImageBitmap
  const pixels = new Uint8ClampedArray(100 * 50 * 4).fill(255)
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      drawImage: (source: CanvasImageSource, x: number, y: number, width: number, height: number) => {
        assert.equal(source, bitmap)
        assert.deepEqual([x, y, width, height], [0, 0, 100, 50])
      },
      getImageData: () => ({ width: 100, height: 50, data: pixels }),
    }),
  }

  Object.defineProperty(globalThis, 'createImageBitmap', {
    configurable: true,
    value: async (source: ImageBitmapSource) => {
      assert.equal(source, file)
      return bitmap
    },
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { createElement: () => canvas },
  })

  try {
    const result = await calculateThumbHashForFile(file)

    assert.deepEqual(
      {
        width: result.width,
        height: result.height,
        originalWidth: result.originalWidth,
        originalHeight: result.originalHeight,
      },
      { width: 100, height: 50, originalWidth: 400, originalHeight: 200 },
    )
    assert.match(result.dataUrl, /^data:image\/png;base64,/)
    assert.ok(result.dataBase64)
    assert.equal(canvas.width, 100)
    assert.equal(canvas.height, 50)
    assert.equal(closed, true)
  }
  finally {
    restoreGlobal('createImageBitmap', originalCreateImageBitmap)
    restoreGlobal('document', originalDocument)
  }
})

function restoreGlobal(key: 'createImageBitmap' | 'document', descriptor?: PropertyDescriptor): void {
  if (descriptor)
    Object.defineProperty(globalThis, key, descriptor)
  else
    Reflect.deleteProperty(globalThis, key)
}
