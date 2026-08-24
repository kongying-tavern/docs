import type ForumAPI from '../api'
import type { SearchParamValue } from './types'
import { buildFormData } from '@/apis/utils'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { apiCall } from '.'
import { reformat } from '../webhook'
import { GITEE_API_CONFIG } from './config'
import { extractOfficialAndAuthorComments } from './inBrowserUtils'
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

const { OWNER, FEEDBACK_REPO } = GITEE_API_CONFIG

export async function getTopic(number: string): Promise<ForumAPI.Topic> {
  const { data } = await apiCall<GITEE.IssueInfo>(
    'get',
    `repos/${OWNER}/${FEEDBACK_REPO}/issues/${number}`,
  )

  return normalizeIssue(data)
}

export async function getTopics(
  query: ForumAPI.Query,
  state?: ForumAPI.TopicState,
  search?: string,
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
      data: issues.map(val => normalizeIssue(val)),
      ...pagination,
    }
  }

  // Try to fetch comments, but don't let it fail the main request
  let comments: GITEE.CommentList = []
  try {
    ;({ data: comments } = await apiCall<GITEE.CommentList>(
      'get',
      `repos/${OWNER}/${FEEDBACK_REPO}/issues/comments`,
      {
        searchParams: {
          page: query.current,
          sort: query.sort || 'created',
          per_page: 100,
        },
        cache: true,
      },
    ))
  }
  catch {
    // Failed to fetch comments, continuing without them
  }

  const data: ForumAPI.Topic[] = []

  issues.forEach((val) => {
    const topic = normalizeIssue(val)

    if (
      !import.meta.env.DEV
      && val.labels.map(val => val.name).includes('DEV-TEST')
    ) {
      return
    }

    data.push({
      relatedComments: extractOfficialAndAuthorComments(val, comments),
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
  state: ForumAPI.TopicState = 'open',
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
      searchParams: {
        number,
        body,
      },
    },
  )

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

  return response.status === 204
}

export async function putTopic(
  number: string | number,
  data: {
    title?: string
    body?: string
    labels?: string
    state?: ForumAPI.TopicState
  },
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
          ...data,
        },
      },
    ))
  }
  catch (error) {
    return { status: 'unknown', error: toError(error) }
  }

  const result = normalizeIssue(issueInfo)

  // 因为 Gitee 接口不识别无权限用户提交的 labels 和 state，所以这里手动通知 Webhook 同步数据
  if (!(data.labels || data.state))
    return { status: 'success', topic: result }

  // 团队成员的提交不需要通知 Webhook 同步
  const { hasAnyRoles } = useRuleChecks()
  if (hasAnyRoles('teamMember', 'feedbackMember').value)
    return { status: 'success', topic: result }

  try {
    await reformat({ number })
  }
  catch (error) {
    return { status: 'partial', topic: result, error: toError(error) }
  }

  return { status: 'success', topic: result }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

export function openTopicOnGitee(number: string | number) {
  window.open(
    `${GITEE_API_CONFIG.BASE_URL}/${OWNER}/${FEEDBACK_REPO}/issues/${number}`,
  )
}
