import type { INTER_KNOT } from './api.d.ts'
import type ForumAPI from '@/src/forum/api/types.d.ts'
import { fetcher } from './client.ts'
import { createImageUploadCache } from './imageUploadCache.ts'
import { normalizeImage } from './utils.ts'

export type ImageUploadRequest = (
  endpoint: string,
  options: {
    body: FormData
    retry: number
    signal?: AbortSignal
  },
) => { json: () => Promise<INTER_KNOT.ImageResponse> }

const defaultRequest: ImageUploadRequest = (endpoint, options) => fetcher.post(endpoint, options)
const uploaders = new WeakMap<ImageUploadRequest, ReturnType<typeof createImageUploadCache>>()

export async function uploadImg(
  rawFile: File,
  options: {
    signal?: AbortSignal
    originalFile?: File
    request?: ImageUploadRequest
  } = {},
): Promise<ForumAPI.Image> {
  const request = options.request ?? defaultRequest
  let uploader = uploaders.get(request)
  if (!uploader) {
    uploader = createImageUploadCache(async (file, { signal }) => {
      const formData = new FormData()
      formData.append('file', file)
      const data = await request('images/upload', {
        body: formData,
        retry: 0,
        signal,
      }).json()
      return normalizeImage(data)
    })
    uploaders.set(request, uploader)
  }
  return uploader(rawFile, options)
}
