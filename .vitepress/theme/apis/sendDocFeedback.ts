import { fetcher } from '.'

export type DocFeedbackResponse = {
  code: number
  message?: string
}

export const sendDocFeedback = async (
  record_id: string,
  type: 'good' | 'bad',
  cancel?: boolean,
): Promise<DocFeedbackResponse> =>
  await fetcher
    .post('docs/feedback', {
      json: {
        record_id: record_id,
        type: type,
        cancel: cancel,
      },
    })
    .json()
