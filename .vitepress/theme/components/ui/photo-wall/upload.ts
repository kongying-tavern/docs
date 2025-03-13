import type { ComputedRef, ExtractPropTypes, InjectionKey, PropType } from 'vue'
import type PhotoWall from './PhotoWall.vue'

import { mutable, NOOP } from '@/components/type'

export interface UploadContext {
  accept: ComputedRef<string>
}

export const uploadContextKey: InjectionKey<UploadContext>
  = Symbol('uploadContextKey')

export const definePropType = <T>(val: any): PropType<T> => val

export type UploadStatus = 'ready' | 'uploading' | 'success' | 'fail'

let fileId = 1

export const genFileId = () => Date.now() + fileId++

export interface UploadFile {
  name: string
  size: number
  uid: number
  url?: string
  raw?: UploadRawFile
  status?: UploadStatus
}

export type UploadUserFile = Omit<UploadFile, 'uid'> &
  Partial<Pick<UploadFile, 'uid'>>

export type UploadFiles = UploadFile[]

export interface UploadRawFile extends File {
  uid: number
}

export interface UploadHooks {
  onRemove: (uploadFile: UploadFile, uploadFiles: UploadFiles) => void
  onChange: (uploadFile: UploadFile, uploadFiles: UploadFiles) => void
  onPreview: (uploadFile: UploadFile) => void
  onExceed: (files: File[], uploadFiles: UploadUserFile[]) => void
}

export type UploadData = Record<string, any>

export const uploadBaseProps = {
  /**
   * @description whether uploading multiple files is permitted
   */
  multiple: Boolean,
  /**
   * @description key name for uploaded file
   */
  name: {
    type: String,
    default: 'file',
  },
  /**
   * @description whether to activate drag and drop mode
   */
  drag: Boolean,
  /**
   * @description accepted [file types](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-accept), will not work when `thumbnail-mode === true`
   */
  accept: {
    type: String,
    default: '.png,.jpg,.gif,.jpeg',
  },
  /**
   * @description default uploaded files
   */
  fileList: {
    type: definePropType<UploadUserFile[]>(Array),
    default: () => mutable([] as const),
  },
  /**
   * @description whether to disable upload
   */
  disabled: Boolean,
  /**
   * @description maximum number of uploads allowed
   */
  limit: Number,

  defaultState: {
    type: String as PropType<UploadStatus>,
    default: 'ready',
  },

  /**
   * @description hide default upload trigger
   */
  hideDefaultTrigger: Boolean,

  /**
   * @description hide default upload trigger
   */
  size: {
    type: definePropType<'xl' | 'lg'>(String),
    default: 'xl',
  },
} as const

export const uploadProps = {
  ...uploadBaseProps,
  /**
   * @description hook function when files are removed
   */
  onRemove: {
    type: definePropType<UploadHooks['onRemove']>(Function),
    default: NOOP,
  },
  /**
   * @description hook function when select file or upload file success or upload file fail
   */
  onChange: {
    type: definePropType<UploadHooks['onChange']>(Function),
    default: NOOP,
  },
  /**
   * @description hook function when clicking the uploaded files
   */
  onPreview: {
    type: definePropType<UploadHooks['onPreview']>(Function),
    default: NOOP,
  },
  /**
   * @description hook function when limit is exceeded
   */
  onExceed: {
    type: definePropType<UploadHooks['onExceed']>(Function),
    default: NOOP,
  },
} as const

export type UploadProps = ExtractPropTypes<typeof uploadProps>

export type UploadInstance = InstanceType<typeof PhotoWall>

// @unocss-include
export const uploadVariants = {
  size: {
    xl: 'size-18 rounded-sm mr-2',
    lg: 'size-24 rounded-lg mr-4',
  },
}
