export const normalizeImage = (image: IMAGES_UPLOAD.IMAGE) => {
  return {
    state: true,
    message: image.message,
    data: {
      id: image.data.key,
      link: image.data.links.url,
      fileSize: image.data.size || 0,
      md5: image.data.md5,
      thumbnailUrl: image.data.links.thumbnail_url,
      originName: image.data.origin_name,
    },
  }
}
