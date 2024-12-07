// @unocss-includes
import ky, { type KyResponse } from 'ky'
import * as oauth from './oauth'
import * as issues from './issues'
import * as user from './user'
import * as labels from './labels'
import { catchError } from '../../utils'
import { useNotificationStore } from '@/stores'

import type ForumAPI from '../api'

export const PREFIX_URL = 'https://gitee.com/'
export const GITEE_CLIENT_ID =
  '053290d8af24515ea1ba7aa9d19175698eef3be29ada8a6a3156804093a21c4d'
export const GITEE_CLIENT_SECRET =
  '490930078ce5da2580a193af163c275c670567e70a93fbe0ca39e15faa8f5271'
export const GITEE_OWNER = 'KYJGYSDT'
export const GITEE_REPO = 'Feedback'
export const SUPPORT_TOPIC_TYPE = ['BUG', 'FEAT', 'SUG', 'ANN']
export const BASIC_FILTER_TAG = 'good-issues'
export const PaginationPageSize = 20

export const fetcher = ky.create({
  prefixUrl: PREFIX_URL,
  timeout: 5000,
  retry: 1,
  hooks: {
    beforeRequest: [(request) => {}],
    afterResponse: [async (_request, _options, response) => {}],
    beforeError: [
      async (error) => {
        const { response } = error
        if (response && response.body) {
          // @ts-ignore
          error.message = `${response.body?.message || (await response.text())}`
          error.name = `GiteeApiError - ${response.status}`
        }
        return error
      },
    ],
  },
})

// TODO
// const httpErrorCode = {
//   '404': () => {

//   },
//   '403': () => {

//   },
//   '400': () => {

//   },
//   '500': () => {

//   }
// }

class HTTPError extends Error {}

const apiCall = async <T>(
  method: 'get' | 'post' | 'patch' | 'delete',
  endpoint: string,
  params?: Record<string, any>,
  body?: any,
): Promise<KyResponse<Promise<T>>> => {
  const notification = useNotificationStore()
  const url = `api/v5/${endpoint}`

  let token = (params ? params['access_token'] : body?.['access_token']) ?? null

  if (token === 'null') return Promise.reject(new Error('Not available token'))

  const [error, response] = await catchError(
    fetcher[method]<Promise<T>>(url, {
      searchParams: params,
      ...(method === 'post' && { json: body }),
    }),
  )

  if (error) {
    notification.add({
      title: error.name,
      icon: 'i-lucide-badge-x bg-red',
      description: `API Error at ${method}:${url}: ${error.message}`,
    })
    return Promise.reject(
      new HTTPError(`API Error at ${url}: ${error.message}`),
    )
  }

  // TODO: EXPORT ERROR
  return response
}

export { oauth, user, issues, apiCall, labels }
