import type ForumAPI from '../forum/api'
import type { INTER_KNOT } from './api'
import { fetcher } from '.'
import { normalizeImage } from './utils'

export async function uploadImg(
  rawFile: File,
): Promise<ForumAPI.Image> {
  const formData = new FormData()
  formData.append('file', rawFile)

  const data = await fetcher
    .post('images/upload', {
      body: formData,
    })
    .json<INTER_KNOT.ImageResponse>()

  return normalizeImage(data)
}
