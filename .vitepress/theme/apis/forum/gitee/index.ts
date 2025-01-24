import { useMemoize } from '@vueuse/core'
import { catchError, isNodeEnvironment } from '../../utils'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { GITEE_API_CONFIG } from './config'
import { handlePagination } from './utils'
import { HTTPError } from './httpError'
import ky from 'ky'

import * as blog from './blog'
import * as issues from './issues'
import * as labels from './labels'
import * as oauth from './oauth'
import * as user from './user'
import * as password from './password'
import { isPlainObject } from 'lodash-es'
import {
  GiteeApiErrorType,
  type ApiCallParams,
  type ApiCallResult,
  type HttpMethod,
} from './types'
import { beforeErrorHooks } from './hooks'

export const fetcher = ky.extend({
  prefixUrl: GITEE_API_CONFIG.PREFIX_URL,
  timeout: 5000,
  retry: 1,
  hooks: {
    beforeError: beforeErrorHooks,
  },
})

const cachedApiCall = useMemoize(
  async <T>(
    method: HttpMethod,
    endpoint: string,
    { params = {}, hooks = {}, body }: ApiCallParams,
  ): ApiCallResult<T> => {
    const url = `${GITEE_API_CONFIG.START_POINT}${endpoint}`

    const options = {
      hooks,
      searchParams: params,
      ...(body && (body instanceof FormData ? { body } : { json: body })),
    }

    if (!isNodeEnvironment() && !endpoint.includes('oauth')) {
      const { auth } = useUserAuthStore()

      const accessToken = auth.accessToken

      if (accessToken) {
        if (body) {
          if (body instanceof FormData) body.append('access_token', accessToken)
          else if (isPlainObject(body)) body.access_token = accessToken
          else params.access_token = accessToken
        } else {
          params.access_token = accessToken
        }
      }
    }

    const [error, response] = await catchError(
      fetcher[method]<Promise<T>>(url, options),
    )

    if (error) {
      return Promise.reject(
        new HTTPError(error.name as GiteeApiErrorType, {
          cause: error,
          method: method,
          endpoint: endpoint,
        }),
      )
    }

    if (params ? params['page'] : body?.['page']) {
      const pagination = await handlePagination(response)
      return [await response.json(), pagination ? pagination[0] : undefined]
    }

    if (method === 'delete') {
      return [{} as T, undefined]
    }

    return [await response.json(), undefined]
  },
  {
    getKey: (
      method: HttpMethod,
      endpoint: string,
      { params, body }: ApiCallParams,
    ) => JSON.stringify({ method, endpoint, params, body }),
  },
)

const apiCall = async <T>(
  method: HttpMethod,
  endpoint: string,
  options: ApiCallParams = {},
): ApiCallResult<T> => {
  const { useCache = true, ...rest } = options

  return useCache
    ? (cachedApiCall(method, endpoint, rest) as ApiCallResult<T>)
    : (cachedApiCall.load(method, endpoint, rest) as ApiCallResult<T>)
}

const clearApiCache = () => cachedApiCall.clear()

const deleteApiCache = (
  method: HttpMethod,
  endpoint: string,
  options: Omit<ApiCallParams, 'useCache'>,
) => cachedApiCall.delete(method, endpoint, options)

export {
  oauth,
  user,
  blog,
  issues,
  password,
  apiCall,
  labels,
  clearApiCache,
  deleteApiCache,
  HTTPError as GiteeAPIError,
}
