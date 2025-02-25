import { UAParser } from 'ua-parser-js'

import { fetcher } from '.'

export interface NewDocFeedbackResponse {
  code: number
  message?: string
  data?: {
    id: string
    feedback_id: string
    record_id: string
  }
}

export async function newDocFeedback(data: {
  path: string
  feedback_type?: string[]
  feedback_content?: string
  user_id?: string
  nickname?: string
  file?: string[]
  user_contact?: string
}): Promise<NewDocFeedbackResponse> {
  let env_data = {
    screen: {},
    ua: '',
    user_platform: '',
  }

  const parser = new UAParser(window.navigator.userAgent)
  const result = parser.getResult()
  env_data = {
    screen: {
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      width: window.screen.width,
      height: window.screen.height,
    },
    ua: navigator.userAgent,
    user_platform: `${result.os.name}-${result.browser.name}`,
  }

  try {
    return await fetcher
      .post('docs/feedback/new', {
        json: {
          path: data.path,
          feedback_type: data.feedback_type,
          feedback_content: data.feedback_content,
          user_id: data.user_id,
          file: data.file,
          nickname: data.nickname,
          user_contract: data.user_contact,
          user_platform: env_data.user_platform,
          user_env_info: JSON.stringify(env_data),
        },
      })
      .json()
  }
  catch (error) {
    console.log(error)
    return await error.response
  }
}
