import { Content } from 'vitepress'
import { UAParser } from 'ua-parser-js'
import { fetcher } from '.'

const parser = new UAParser(window.navigator.userAgent)
const result = parser.getResult()

export type NewDocFeedbackResponse = {
  code: number
  message?: string
  data?: {
    id: string
    feedback_id: string
    record_id: string
  }
}

export const newDocFeedback = async (data: {
  path: string
  feedback_type?: Array<string>
  feedback_content?: string
  user_id?: string
  nickname?: string
  file?: Array<string>
  user_contact?: string
}): Promise<NewDocFeedbackResponse> => {
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
          user_platform: `${result.os.name}-${result.browser.name}`,
          user_env_info: JSON.stringify({
            userAgent: navigator.userAgent,
            screen: {
              availWidth: window.screen.availWidth,
              availHeight: window.screen.availHeight,
              width: window.screen.width,
              height: window.screen.height,
            },
          }),
        },
      })
      .json()
  } catch (error) {
    console.log(error)
    return await error.response
  }
}
