import ky from 'ky'

import { catchError } from '../../utils'
import { GITEE_API_CONFIG } from '../gitee/config'

export const PREFIX_URL = 'https://api.yuanshen.site/webhook/'
export const WEBHOOK_TOKEN = '4c0001c8-dec1-4c13-a689-4cbcd7d156ae'
export const fetcher = ky.create({
  prefixUrl: PREFIX_URL,
  timeout: 8000,
  retry: 2,
})

export async function reformat(
  options: GITEE_WEBHOOK.OPTIONS,
): Promise<[undefined, GITEE_WEBHOOK.PARAMS] | [Error, undefined]> {
  const {
    repo = GITEE_API_CONFIG.FEEDBACK_REPO,
    owner = GITEE_API_CONFIG.OWNER,
    number,
  } = options
  const [error, response] = await catchError(
    fetcher.post<GITEE_WEBHOOK.PARAMS>('gitee/feedback/reformat', {
      json: {
        webhook_token: WEBHOOK_TOKEN,
        owner,
        repo,
        number,
      },
    }),
  )

  if (error)
    return Promise.reject(error)

  const data = await response.json()

  return [error, data]
}
