import type ForumAPI from '../forum/api'
import type { INTER_KNOT } from './api'
import { fetcher } from '.'
import { normalizeImage } from './utils'

export type ImageUploadRequest = (
  endpoint: string,
  options: {
    body: FormData
    retry: number
    signal?: AbortSignal
  },
) => { json: () => Promise<INTER_KNOT.ImageResponse> }

export async function uploadImg(
  rawFile: File,
  options: {
    signal?: AbortSignal
    request?: ImageUploadRequest
  } = {},
): Promise<ForumAPI.Image> {
  const formData = new FormData()
  formData.append('file', rawFile)

  const request: ImageUploadRequest = options.request
    ?? ((endpoint, requestOptions) => fetcher.post(endpoint, requestOptions))
  const data = await request('images/upload', {
    body: formData,
    retry: 0,
    ...(options.signal ? { signal: options.signal } : {}),
  })
    .json()

  return normalizeImage(data)
}
