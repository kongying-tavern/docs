declare namespace IMAGES_UPLOAD {
  type ALLOWED_TYPE = 'jpeg' | 'jpg' | 'png' | 'gif' | 'webp'

  type IMAGE = {
    ret: boolean
  } & (
    | {
        ret: true
        info: { md5: string; size: number }
        error?: undefined
      }
    | {
        ret: false
        info?: undefined
        error: { code: number; message: string }
      }
  )
}
