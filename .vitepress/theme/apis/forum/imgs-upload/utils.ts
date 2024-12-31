import { PREFIX_URL } from '.'

export const normalizeImage = (image: IMAGES_UPLOAD.IMAGE) => {
  return {
    link: PREFIX_URL + image.info?.md5,
    fileSize: image.info?.size || 0,
  }
}
