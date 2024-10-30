import { fetcher } from '.'

export interface PageviewResponse {
  code: number
  message?: string
}

export const pageview = async (record_id): Promise<PageviewResponse | null> => {
  // @ts-ignore
  if (import.meta.env.SSR) return null
  return fetcher
    .get('docs/pageview', {
      searchParams: {
        record_id,
      },
    })
    .json()
}
