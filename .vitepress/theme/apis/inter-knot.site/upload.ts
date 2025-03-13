import type ForumAPI from '../forum/api'
import type { INTER_KNOT } from './api'
import { fetcher } from '.'
import { catchError } from '../utils'
import { normalizeImage } from './utils'

export async function uploadImg(
  rawFile: File,
): Promise<ForumAPI.Image> {
  const formData = new FormData()
  formData.append('file', rawFile)

  const [error, response] = await catchError(
    fetcher.post<INTER_KNOT.ImageResponse>('images/upload', {
      body: formData,
    }),
  )

  if (error)
    return Promise.reject(error)

  const data = await response.json()

  return normalizeImage(data)
}
