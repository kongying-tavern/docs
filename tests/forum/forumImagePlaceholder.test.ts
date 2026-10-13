import { thumbHashToDataURL } from 'thumbhash'
import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('thumbhash', () => ({ thumbHashToDataURL: vi.fn(() => 'data:image/png;base64,placeholder') }))

beforeEach(() => {
  vi.resetModules()
  vi.mocked(thumbHashToDataURL).mockClear()
})

describe('forum placeholder cache', () => {
  test('remounted identical images do not repeat placeholder decoding', async () => {
    const { forumImagePlaceholder } = await import('../../src/forum/services/forumImagePlaceholder')
    const hash = btoa('valid-placeholder')
    expect(forumImagePlaceholder(hash)).toBe('data:image/png;base64,placeholder')
    expect(forumImagePlaceholder(hash)).toBe('data:image/png;base64,placeholder')
    expect(thumbHashToDataURL).toHaveBeenCalledOnce()
  })

  test('recent placeholders survive eviction while older entries are released', async () => {
    const { forumImagePlaceholder } = await import('../../src/forum/services/forumImagePlaceholder')
    for (let index = 0; index < 128; index++)
      forumImagePlaceholder(btoa(`hash-${index}`))
    forumImagePlaceholder(btoa('hash-0'))
    forumImagePlaceholder(btoa('hash-128'))
    forumImagePlaceholder(btoa('hash-0'))
    expect(thumbHashToDataURL).toHaveBeenCalledTimes(129)
    forumImagePlaceholder(btoa('hash-1'))
    expect(thumbHashToDataURL).toHaveBeenCalledTimes(130)
  })

  test('malformed optional metadata falls back without blocking original images', async () => {
    const { forumImagePlaceholder } = await import('../../src/forum/services/forumImagePlaceholder')
    expect(forumImagePlaceholder('not base64!')).toBeUndefined()
    expect(forumImagePlaceholder('not base64!')).toBeUndefined()
    expect(thumbHashToDataURL).not.toHaveBeenCalled()
  })
})
