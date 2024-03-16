import { fetcher } from '.'

export type PageviewResponse = {
  code: number
  message?: string
}

export const pageview = async (record_id): Promise<PageviewResponse> =>
  await fetcher
    .get('docs/pageview', {
      searchParams: {
        record_id,
      },
    })
    .json()
