import { fetcher } from '.'

export interface DocFeedbackResponse {
  code: number
  message?: string
}

export const sendDocFeedback = async (
  record_id: string,
  type: 'bad' | 'good',
  cancel?: boolean,
): Promise<DocFeedbackResponse> =>
  fetcher
    .post('docs/feedback', {
      json: {
        record_id,
        type,
        cancel,
      },
    })
    .json()
