import { AxiosPromise } from 'axios'

export type AxiosReturnType<T> = T extends (
  ...args: any[]
) => AxiosPromise<infer R>
  ? R
  : any
export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type ResponseType =
  | 'arraybuffer'
  | 'blob'
  | 'document'
  | 'json'
  | 'text'
  | 'stream'

export interface AxiosRequest {
  baseURL?: string
  url: string
  data?: any
  params?: any
  method?: Method
  headers?: any
  timeout?: number
  responseType?: ResponseType
}
