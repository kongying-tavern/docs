import type { AxiosPromise } from 'axios'

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

interface UrlDict {
  [key: string]: Record<string, string>
}

export interface ClientActivatedVersionData {
  code: number
  data: {}
  msg: string | null
}
