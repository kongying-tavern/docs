declare namespace IMAGES_UPLOAD {
  type ALLOWED_TYPE = 'jpeg' | 'jpg' | 'png' | 'gif' | 'webp'

  type IMAGE = {
    status: boolean
    message: string
    data: {
      key: string
      name: string
      pathname: string
      origin_name: string
      size: number
      mimetype: string
      extension: string
      md5: string
      sha1: string
      links: {
        url: string
        html: string
        bbcode: string
        markdown: string
        markdown_with_link: string
        thumbnail_url: string
      }
    }
  }
}
