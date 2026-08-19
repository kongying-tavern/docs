import ky from 'ky'

import { GITEE_API_CONFIG } from '../gitee/config'

const WEBHOOK_TOKEN = '4c0001c8-dec1-4c13-a689-4cbcd7d156ae'

const fetcher = ky.create({
  prefix: 'https://api.yuanshen.site/webhook',
  timeout: 8000,
  retry: 2,
})

/** 通知 Webhook 重新同步指定 issue 的数据；失败时抛错由调用方处理 */
export async function reformat(
  options: GITEE_WEBHOOK.OPTIONS,
): Promise<GITEE_WEBHOOK.PARAMS> {
  const {
    repo = GITEE_API_CONFIG.FEEDBACK_REPO,
    owner = GITEE_API_CONFIG.OWNER,
    number,
  } = options

  return fetcher
    .post('gitee/feedback/reformat', {
      json: {
        webhook_token: WEBHOOK_TOKEN,
        owner,
        repo,
        number,
      },
    })
    .json<GITEE_WEBHOOK.PARAMS>()
}
