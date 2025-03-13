import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import ky, { HTTPError } from 'ky'
import * as oauth from './oauth'
import * as reactions from './reactions'
import * as translate from './translate'
import * as upload from './upload'

export const PREFIX_URL = 'https://hub.inter-knot.site/api/'

export const fetcher = ky.create({
  prefixUrl: PREFIX_URL,
  timeout: 10000,
  retry: 2,
  hooks: {
    beforeRequest: [
      async (request) => {
        if (import.meta.env.SSR)
          return
        const userInfo = useUserInfoStore()
        const userAuth = useUserAuthStore()

        if (!userInfo.fingerprint)
          await userInfo.refreshFingerprint()
        request.headers.set('Fingerprint', ` ${userInfo.fingerprint?.visitorId}`)

        if (userAuth.isSSOTokenValid('interKnot').value && userAuth.ssoAuth.interKnot.accessToken)
          request.headers.set('Authorization', `Bearer ${userAuth.ssoAuth.interKnot.accessToken}`)
      },
    ],
    beforeRetry: [
      async ({ error }) => {
        if (import.meta.env.SSR)
          return

        if (error instanceof HTTPError && error.response.status === 401) {
          const userAuth = useUserAuthStore()
          if (userAuth.isTokenValid && !userAuth.isSSOTokenValid('interKnot').value) {
            await userAuth.refreshSSOAuth('interKnot')
          }
        }
      },
    ],
  },
})

export { oauth, reactions, translate, upload }
