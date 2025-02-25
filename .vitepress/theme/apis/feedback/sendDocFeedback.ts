import { fetcher } from '.'

export interface DocFeedbackResponse {
  code: number
  message?: string
}

export async function sendDocFeedback(
  record_id: string,
  type: 'bad' | 'good',
  cancel?: boolean,
): Promise<DocFeedbackResponse> {
  return fetcher
    .post('docs/feedback', {
      json: {
        record_id,
        type,
        cancel,
      },
    })
    .json()
}
