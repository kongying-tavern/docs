import { fetcher } from '.'

export type PageviewResponse = {
  code: number
  message?: string
}

export const pageview = async (record_id): Promise<PageviewResponse | null> => {
  // @ts-ignore
  if (import.meta.env.SSR) return null
  return await fetcher
    .get('docs/pageview', {
      searchParams: {
        record_id,
      },
    })
    .json()
}
