import { fetcher } from '.'

export type PageInfoResponse = {
  code: number
  message?: string
  data: {
    good: number
    bad: number
    pageview: number
    lastupdate: number
    id: string
    record_id: string
  }
}

export const getPageInfo = async (page): Promise<PageInfoResponse> =>
  await fetcher
    .get('docs/pageinfo', {
      searchParams: {
        path: String(page.value.filePath).replace('.md', ''),
      },
    })
    .json()
