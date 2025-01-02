import ky from 'ky'
import { catchError } from '../../utils'
import { normalizeImage } from './utils'

import type ForumAPI from '../api'

export const PREFIX_URL = 'https://img.violetsnow.cc/'

export const fetcher = ky.create({
  prefixUrl: PREFIX_URL,
  timeout: 8000,
  retry: 2,
  headers: {
    code: 'yuanshen.site',
  },
})

export const uploadImg = async (
  rawFile: File,
  type: IMAGES_UPLOAD.ALLOWED_TYPE | string,
): Promise<ForumAPI.Image> => {
  const [error, response] = await catchError(
    fetcher.post<IMAGES_UPLOAD.IMAGE>('upload', {
      body: await rawFile.arrayBuffer(),
      headers: {
        'Content-Type': type.split('/')[1],
      },
    }),
  )

  if (error) return Promise.reject(error)

  const data = await response.json()

  if (data.error) return Promise.reject(data.error)

  return normalizeImage(data)
}
