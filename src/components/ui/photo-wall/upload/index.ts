export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error'

export interface UploadFile extends File {
  uid: string
  status?: UploadStatus
  percent?: number
  response?: unknown
  error?: Error
}

export interface UploadUserFile {
  uid: string
  name: string
  size: number
  type: string
  url?: string
  status: UploadStatus
  file?: File
  response?: unknown
  error?: Error
}
