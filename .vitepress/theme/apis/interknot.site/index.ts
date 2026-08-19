import type { BeforeRequestHook, BeforeRetryHook } from 'ky'
import ky, { isHTTPError } from 'ky'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import * as oauth from './oauth'
import * as reactions from './reactions'
import * as translate from './translate'
import * as upload from './upload'

/** 附加设备指纹与 SSO token（仅浏览器环境） */
const attachIdentity: BeforeRequestHook = async ({ request }) => {
  if (import.meta.env.SSR)
    return

  const userInfo = useUserInfoStore()
  const userAuth = useUserAuthStore()

  if (!userInfo.fingerprint)
    await userInfo.refreshFingerprint()

  const visitorId = userInfo.fingerprint?.visitorId
  if (visitorId)
    request.headers.set('Fingerprint', visitorId)

  if (userAuth.isSSOTokenValid('interKnot').value && userAuth.ssoAuth.interKnot.accessToken)
    request.headers.set('Authorization', `Bearer ${userAuth.ssoAuth.interKnot.accessToken}`)
}

/** 401 时刷新 SSO token，并让本次重试携带新 token */
const refreshSSOTokenOnUnauthorized: BeforeRetryHook = async ({ request, error }) => {
  if (import.meta.env.SSR)
    return

  if (!isHTTPError(error) || error.response.status !== 401)
    return

  const userAuth = useUserAuthStore()
  if (!userAuth.isTokenValid || userAuth.isSSOTokenValid('interKnot').value)
    return

  await userAuth.refreshSSOAuth('interKnot')

  const accessToken = userAuth.ssoAuth.interKnot.accessToken
  if (!accessToken)
    return

  const headers = new Headers(request.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  return new Request(request, { headers })
}

export const fetcher = ky.create({
  prefix: 'https://hub.interknot.site/api',
  timeout: 10000,
  retry: 2,
  hooks: {
    beforeRequest: [attachIdentity],
    beforeRetry: [refreshSSOTokenOnUnauthorized],
  },
})

export { oauth, reactions, translate, upload }
