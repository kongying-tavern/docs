import type {
  ApiCallParams,
  ApiCallResult,
  GiteeApiErrorType,
  HttpMethod,
} from './types'

import { useUserAuthStore } from '@/stores/useUserAuth'
import { useMemoize } from '@vueuse/core'
import ky from 'ky'

import { isPlainObject } from 'lodash-es'
import { catchError, isNodeEnvironment } from '../../utils'
import * as blog from './blog'
import { GITEE_API_CONFIG } from './config'
import { beforeErrorHooks } from './hooks'
import { HTTPError } from './httpError'
import * as issues from './issues'
import * as labels from './labels'
import * as oauth from './oauth'
import * as password from './password'
import * as user from './user'

import { handlePagination } from './utils'

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
    const url = `${GITEE_API_CONFIG.ENDPOINT_PREFIX}${endpoint}`

    if (!isNodeEnvironment() && !endpoint.includes('oauth')) {
      const { accessToken } = useUserAuthStore()

      if (accessToken) {
        if (body) {
          if (body instanceof FormData)
            body.append('access_token', accessToken)
          else if (isPlainObject(body))
            body.access_token = accessToken
          else params.access_token = accessToken
        }
        else {
          params.access_token = accessToken
        }
      }
    }

    const options = {
      hooks,
      ...(Object.keys(params).length > 0 ? { searchParams: params } : {}),
      ...(body && (body instanceof FormData ? { body } : { json: body })),
    }

    const [error, response] = await catchError(
      fetcher[method]<Promise<T>>(url, options),
    )

    if (error) {
      return Promise.reject(
        new HTTPError(error.name as GiteeApiErrorType, {
          cause: error,
          method,
          endpoint,
          message: error.message,
        }),
      )
    }

    if (params ? params.page : body?.page) {
      const pagination = await handlePagination(response)
      return [await response.json(), pagination ? pagination[0] : undefined]
    }

    if (['delete', 'put'].includes(method)) {
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

async function apiCall<T>(
  method: HttpMethod,
  endpoint: string,
  options: ApiCallParams = {},
): ApiCallResult<T> {
  const { useCache = false, ...rest } = options

  return useCache
    ? (cachedApiCall(method, endpoint, rest) as ApiCallResult<T>)
    : (cachedApiCall.load(method, endpoint, rest) as ApiCallResult<T>)
}

const clearApiCache = () => cachedApiCall.clear()

function deleteApiCache(
  method: HttpMethod,
  endpoint: string,
  options: Omit<ApiCallParams, 'useCache'>,
) {
  return cachedApiCall.delete(method, endpoint, options)
}

export {
  apiCall,
  blog,
  clearApiCache,
  deleteApiCache,
  HTTPError as GiteeAPIError,
  issues,
  labels,
  oauth,
  password,
  user,
}
