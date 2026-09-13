import type ForumAPI from '../api'
import type { OfficialUserPredicate } from './inBrowserUtils'
import type { SearchParamValue } from './types'
import type { TopicStateFilter } from '~/services/forum/forumQueryContracts'
import { buildFormData } from '@/apis/utils'
import { reportRequestFailure } from '~/services/telemetry/request'
import { apiCall, deleteApiCache } from '.'
import { reformat } from '../webhook'
import { GITEE_API_CONFIG } from './config'
import { extractErrorMessages, GiteeAPIError, isErrorsOnlyPayload, toGiteeAPIError } from './errors'
import { extractOfficialAndAuthorComments } from './inBrowserUtils'
import { GiteeApiErrorType } from './types'
import {
  normalizeComment,
  normalizeIssue,
  processLabels,
} from './utils'

export type TopicUpdateOutcome
  = | { status: 'success', topic: ForumAPI.Topic }
    | { status: 'partial', topic: ForumAPI.Topic, error: Error }
    | { status: 'unknown', error: Error }

export interface TopicListRequest {
  endpoint: string
  searchParams: Record<string, SearchParamValue>
}

export interface TopicUpdateOptions {
  skipReformat?: boolean
}

const { OWNER, FEEDBACK_REPO } = GITEE_API_CONFIG

const RELATED_COMMENT_MAX_PAGES = 3
const RELATED_COMMENT_PER_PAGE = 100

function isDevTestIssue(issue: GITEE.IssueInfo): boolean {
  return (issue.labels ?? []).some(label => label?.name === 'DEV-TEST')
}

/** 键须与 fetchCommentsForIssueWindow 的请求字面量一致 */
function invalidateRelatedCommentCache(): void {
  for (let page = 1; page <= RELATED_COMMENT_MAX_PAGES; page++) {
    deleteApiCache('get', `repos/${OWNER}/${FEEDBACK_REPO}/issues/comments`, {
      searchParams: {
        page,
        sort: 'created',
        per_page: RELATED_COMMENT_PER_PAGE,
      },
    })
  }
}

/** 键须与 getPinnedList/getAnnouncementList 的请求字面量一致 */
function invalidatePinnedAndAnnouncementCache(): void {
  deleteApiCache('get', `repos/${OWNER}/${FEEDBACK_REPO}/issues`, {
    searchParams: {
      state: 'open',
      labels: ['PINNED'],
    },
  })
  deleteApiCache('get', `repos/${OWNER}/${FEEDBACK_REPO}/issues`, {
    searchParams: {
      state: 'open',
      labels: ['TYP-ANN'],
    },
  })
}

/**
 * 以本页最早创建的 issue 为锚点、按创建时间倒序翻页拉取评论：
 * 每条评论必晚于其所属 issue 的创建时间，故此窗口可覆盖本页主题的作者/官方评论
 */
async function fetchCommentsForIssueWindow(issues: GITEE.IssueInfo[]): Promise<GITEE.CommentList> {
  const anchorMs = issues
    .map(val => Date.parse(val.created_at))
    .filter(ts => !Number.isNaN(ts))
    .reduce((min, ts) => Math.min(min, ts), Number.POSITIVE_INFINITY)

  if (!Number.isFinite(anchorMs))
    return []

  const comments: GITEE.CommentList = []
  for (let page = 1; page <= RELATED_COMMENT_MAX_PAGES; page++) {
    let pageComments: GITEE.CommentList
    try {
      ;({ data: pageComments } = await apiCall<GITEE.CommentList>(
        'get',
        `repos/${OWNER}/${FEEDBACK_REPO}/issues/comments`,
        {
          searchParams: {
            page,
            sort: 'created',
            per_page: RELATED_COMMENT_PER_PAGE,
          },
          cache: true,
        },
      ))
    }
    catch (error) {
      reportRequestFailure(toGiteeAPIError(error, {
        method: 'get',
        endpoint: `repos/${OWNER}/${FEEDBACK_REPO}/issues/comments`,
      }))
      break
    }

    if (pageComments.length === 0)
      break

    comments.push(...pageComments)

    const oldestComment = pageComments.at(-1)
    const oldestMs = oldestComment ? Date.parse(oldestComment.created_at) : Number.NaN
    if (Number.isNaN(oldestMs) || oldestMs < anchorMs)
      break
  }

  return comments
}

export async function getTopic(number: string): Promise<ForumAPI.Topic> {
  const { data } = await apiCall<GITEE.IssueInfo>(
    'get',
    `repos/${OWNER}/${FEEDBACK_REPO}/issues/${number}`,
  )

  return normalizeIssue(data)
}

export async function getTopics(
  query: ForumAPI.Query,
  state: TopicStateFilter | undefined,
  search: string | undefined,
  isOfficialUser: OfficialUserPredicate,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Topic[]>> {
  // Separate the requests to prevent comments timeout from affecting issues
  const request = buildTopicListRequest(query, state, search)
  const { data: issues, pagination } = await apiCall<GITEE.IssueList>(
    'get',
    request.endpoint,
    {
      searchParams: request.searchParams,
    },
  )

  if (search) {
    return {
      data: issues
        .filter(val => import.meta.env.DEV || !isDevTestIssue(val))
        .map(val => normalizeIssue(val)),
      ...pagination,
    }
  }

  const comments = await fetchCommentsForIssueWindow(issues)

  const data: ForumAPI.Topic[] = []

  issues.forEach((val) => {
    const topic = normalizeIssue(val)

    if (
      !import.meta.env.DEV
      && isDevTestIssue(val)
    ) {
      return
    }

    data.push({
      relatedComments: extractOfficialAndAuthorComments(val, comments, isOfficialUser),
      ...topic,
    })
  })

  return {
    data,
    ...pagination,
  }
}

export async function getPinnedList(): Promise<ForumAPI.Topic[]> {
  const { data: issues } = await apiCall<GITEE.IssueList>(
    'get',
    `repos/${OWNER}/${FEEDBACK_REPO}/issues`,
    {
      searchParams: {
        state: 'open',
        labels: ['PINNED'],
      },
      cache: true,
    },
  )

  return issues.map(issue => Object.assign(normalizeIssue(issue), { pinned: true }))
}

export async function getAnnouncementList(): Promise<ForumAPI.Topic[]> {
  const { data: issues } = await apiCall<GITEE.IssueList>(
    'get',
    `repos/${OWNER}/${FEEDBACK_REPO}/issues`,
    {
      searchParams: {
        state: 'open',
        labels: ['TYP-ANN'],
      },
      cache: true,
    },
  )

  return issues.map(issue => normalizeIssue(issue))
}

export async function getTopicComments(
  repo:
    | typeof GITEE_API_CONFIG.FEEDBACK_REPO
    | typeof GITEE_API_CONFIG.BLOG_REPO,
  query: ForumAPI.Query,
  number: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Comment[]>> {
  const { data: commentList, pagination } = await apiCall<GITEE.CommentList>(
    'get',
    `repos/${OWNER}/${repo}/issues/${number}/comments`,
    {
      searchParams: {
        number,
        page: query.current,
        sort: query.sort || 'created',
        per_page: query.pageSize,
      },
    },
  )
  return {
    data: commentList.map(val => normalizeComment(val)),
    ...pagination,
  }
}

export function buildTopicListRequest(
  query: ForumAPI.Query,
  state: TopicStateFilter = 'open',
  search?: string,
): TopicListRequest {
  const labels = processLabels(query.filter).labels
  if (search) {
    return {
      endpoint: 'search/issues',
      searchParams: {
        repo: `${OWNER}/${FEEDBACK_REPO}`,
        state,
        q: search,
        sort: `${query.sort}_at`,
        page: query.current,
        per_page: query.pageSize,
        author: query.creator ?? undefined,
        label: labels,
      },
    }
  }

  return {
    endpoint: `repos/${OWNER}/${FEEDBACK_REPO}/issues`,
    searchParams: {
      state,
      page: query.current,
      sort: query.sort || 'created',
      per_page: query.pageSize,
      creator: query.creator ?? undefined,
      ...processLabels(query.filter),
    },
  }
}

export async function postTopic(data: ForumAPI.FormSubmitData): Promise<ForumAPI.Topic> {
  const form = buildFormData({
    owner: OWNER,
    repo: FEEDBACK_REPO,
    ...data,
  })

  const { data: issueInfo } = await apiCall<GITEE.IssueInfo>(
    'post',
    `repos/${OWNER}/issues`,
    {
      body: form,
    },
  )

  // Gitee 对未绑定手机号等创建失败返回 2xx + errors 对象而非 IssueInfo；
  // 识别后按失败抛出，避免误报发布成功诱导重复发帖
  const errorMessages = isErrorsOnlyPayload(issueInfo) ? extractErrorMessages(issueInfo) : []
  if (errorMessages.length > 0) {
    throw new GiteeAPIError(GiteeApiErrorType.ApiError, {
      message: errorMessages.join('\n'),
      method: 'post',
      endpoint: `repos/${OWNER}/issues`,
    })
  }

  return normalizeIssue(issueInfo)
}

export async function postTopicComment(
  repo: string,
  number: string,
  body: string,
): Promise<ForumAPI.Comment> {
  const { data: comment } = await apiCall<GITEE.Comment>(
    'post',
    `repos/${OWNER}/${repo}/issues/${number}/comments`,
    {
      json: {
        body,
      },
    },
  )

  invalidateRelatedCommentCache()

  return normalizeComment(comment)
}

export async function deleteTopicComment(
  id: number | string,
  repo: string = FEEDBACK_REPO,
): Promise<boolean> {
  const { response } = await apiCall<GITEE.IssueList>(
    'delete',
    `repos/${OWNER}/${repo}/issues/comments/${id}`,
    {
      searchParams: {
        id,
      },
    },
  )

  const deleted = response.status === 204

  if (deleted)
    invalidateRelatedCommentCache()

  return deleted
}

export async function putTopic(
  number: string | number,
  data: {
    title?: string
    body?: string
    labels?: string
    state?: ForumAPI.TopicState
  },
  options: TopicUpdateOptions = {},
): Promise<TopicUpdateOutcome> {
  let issueInfo: GITEE.IssueInfo
  try {
    ;({ data: issueInfo } = await apiCall<GITEE.IssueInfo>(
      'patch',
      `repos/${OWNER}/issues/${number}`,
      {
        searchParams: {
          repo: FEEDBACK_REPO,
          owner: OWNER,
        },
        // 避免 URL 长度限制
        json: data,
      },
    ))
  }
  catch (error) {
    return { status: 'unknown', error: toError(error) }
  }

  const result = normalizeIssue(issueInfo)

  invalidatePinnedAndAnnouncementCache()

  // 因为 Gitee 接口不识别无权限用户提交的 labels 和 state，所以这里手动通知 Webhook 同步数据
  if (!(data.labels || data.state))
    return { status: 'success', topic: result }

  if (options.skipReformat)
    return { status: 'success', topic: result }

  try {
    await reformat({ number })
  }
  catch (error) {
    return { status: 'partial', topic: result, error: toError(error) }
  }

  try {
    return { status: 'success', topic: await getTopic(String(number)) }
  }
  catch (error) {
    return { status: 'partial', topic: result, error: toError(error) }
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

export function openTopicOnGitee(number: string | number) {
  window.open(
    `${GITEE_API_CONFIG.BASE_URL}/${OWNER}/${FEEDBACK_REPO}/issues/${number}`,
  )
}
