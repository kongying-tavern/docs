import type ForumAPI from '../forum'
import { buildFormData } from '~/services/apiUtils'
import { apiCall, deleteApiCache } from '.'
import { GITEE_API_CONFIG } from './config'
import { extractErrorMessages, GiteeAPIError, isErrorsOnlyPayload, toGiteeAPIError } from './errors'
import { GiteeApiErrorType } from './types'

const { OWNER, FEEDBACK_REPO } = GITEE_API_CONFIG

const LABELS_ENDPOINT = `repos/${OWNER}/${FEEDBACK_REPO}/labels`
const LABEL_PAGE_SIZE = 100
const MAX_FALLBACK_LABEL_PAGES = 100

const HASH_PREFIX_REGEX = /^#/
let cachedLabelPageCount = 1

interface LabelPageResult {
  data: GITEE.IssueLabel[]
  pagination?: ForumAPI.PaginationParams
}

export type LabelPageFetcher = (page: number, cache: boolean) => Promise<LabelPageResult>

/** Gitee 标签颜色为不带 # 的 6 位十六进制值 */
export function normalizeLabelColor(color: string): string {
  return color.trim().replace(HASH_PREFIX_REGEX, '').toUpperCase()
}

/** 与 getAllLabels(cache: true) 的缓存键一致，写操作后失效列表缓存 */
export function invalidateLabelsCache(): void {
  deleteApiCache('get', LABELS_ENDPOINT, {})
  for (let page = 1; page <= cachedLabelPageCount; page++) {
    deleteApiCache('get', LABELS_ENDPOINT, {
      searchParams: { page, per_page: LABEL_PAGE_SIZE },
    })
  }
}

export async function getAllLabels(
  cache = true,
  fetchPage: LabelPageFetcher = fetchLabelPage,
): Promise<GITEE.IssueLabel[]> {
  const labelsByName = new Map<string, GITEE.IssueLabel>()
  let page = 1
  let totalPages: number | null = null

  while (totalPages === null || page <= totalPages) {
    const result = await fetchPage(page, cache)
    cachedLabelPageCount = Math.max(cachedLabelPageCount, page)
    for (const label of result.data)
      labelsByName.set(label.name, label)

    const reportedTotalPages = result.pagination?.totalPage
    if (reportedTotalPages && reportedTotalPages > 0)
      totalPages = reportedTotalPages
    else if (result.data.length < LABEL_PAGE_SIZE)
      totalPages = page
    else if (page >= MAX_FALLBACK_LABEL_PAGES)
      throw new Error(`Label pagination exceeded ${MAX_FALLBACK_LABEL_PAGES} pages without a terminal response`)

    page += 1
  }

  return [...labelsByName.values()]
}

async function fetchLabelPage(page: number, cache: boolean): Promise<LabelPageResult> {
  return apiCall<GITEE.IssueLabel[]>('get', LABELS_ENDPOINT, {
    cache,
    searchParams: { page, per_page: LABEL_PAGE_SIZE },
  })
}

function toLabelApiError(method: 'post' | 'patch' | 'delete', error: unknown): GiteeAPIError {
  return toGiteeAPIError(error, { method, endpoint: LABELS_ENDPOINT })
}

/** Gitee 部分写接口在失败时返回 2xx + errors 对象而非 Label，识别后按失败抛出 */
function assertLabelPayload(label: GITEE.IssueLabel, method: 'post' | 'patch'): GITEE.IssueLabel {
  const errorMessages = isErrorsOnlyPayload(label) ? extractErrorMessages(label) : []
  if (errorMessages.length > 0) {
    throw new GiteeAPIError(GiteeApiErrorType.ApiError, {
      message: errorMessages.join('\n'),
      method,
      endpoint: LABELS_ENDPOINT,
    })
  }
  return label
}

export async function getLabel(name: string): Promise<GITEE.IssueLabel> {
  const { data } = await apiCall<GITEE.IssueLabel>(
    'get',
    `${LABELS_ENDPOINT}/${encodeURIComponent(name)}`,
  )

  return data
}

export async function createLabel(
  name: string,
  color: string,
): Promise<GITEE.IssueLabel> {
  try {
    const { data } = await apiCall<GITEE.IssueLabel>('post', LABELS_ENDPOINT, {
      body: buildFormData({
        name,
        color: normalizeLabelColor(color),
      }),
    })

    return assertLabelPayload(data, 'post')
  }
  catch (error) {
    throw toLabelApiError('post', error)
  }
}

export async function updateLabel(
  originalName: string,
  data: {
    name?: string
    color?: string
  },
): Promise<GITEE.IssueLabel> {
  try {
    const { data: label } = await apiCall<GITEE.IssueLabel>(
      'patch',
      `${LABELS_ENDPOINT}/${encodeURIComponent(originalName)}`,
      {
        body: buildFormData({
          ...(data.name ? { name: data.name } : {}),
          ...(data.color ? { color: normalizeLabelColor(data.color) } : {}),
        }),
      },
    )

    return assertLabelPayload(label, 'patch')
  }
  catch (error) {
    throw toLabelApiError('patch', error)
  }
}

export async function deleteLabel(name: string): Promise<boolean> {
  try {
    const { response } = await apiCall<unknown>(
      'delete',
      `${LABELS_ENDPOINT}/${encodeURIComponent(name)}`,
    )

    return response.status === 204
  }
  catch (error) {
    throw toLabelApiError('delete', error)
  }
}
