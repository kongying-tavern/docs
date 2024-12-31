import { definePropType, uploadBaseProps } from './upload'
import { NOOP } from '@/components/type'

import type { ExtractPropTypes } from 'vue'
import type UploadPhoto from './UploadPhoto.vue'
import type { UploadFile, UploadHooks, UploadRawFile } from './upload.ts'

export const uploadPhotoProps = {
  ...uploadBaseProps,
  onStart: {
    type: definePropType<(rawFile: UploadRawFile) => void>(Function),
    default: NOOP,
  },
  onRemove: {
    type: definePropType<
      (file: UploadFile | UploadRawFile, rawFile?: UploadRawFile) => void
    >(Function),
    default: NOOP,
  },
  onExceed: {
    type: definePropType<UploadHooks['onExceed']>(Function),
    default: NOOP,
  },
} as const

export type UploadPhotoProps = ExtractPropTypes<typeof uploadPhotoProps>

export type UploadPhotoInstance = InstanceType<typeof UploadPhoto>
