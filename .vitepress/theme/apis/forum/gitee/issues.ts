import type ForumAPI from '../api'
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
  setFilterTags,
} from './utils'

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
  if (search)
    return searchTopics(query, search)

  // Separate the requests to prevent comments timeout from affecting issues
  const { data: issues, pagination } = await apiCall<GITEE.IssueList>(
    'get',
    `repos/${OWNER}/${FEEDBACK_REPO}/issues`,
    {
      searchParams: {
        state: state || 'open',
        page: query.current,
        sort: query.sort || 'created',
        per_page: query.pageSize,
        creator: query.creator ?? undefined,
        ...processLabels(query.filter),
      },
    },
  )

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

export async function searchTopics(
  query: ForumAPI.Query,
  q: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Topic[]>> {
  const { data: issueList, pagination } = await apiCall<GITEE.IssueList>(
    'get',
    `search/issues`,
    {
      searchParams: {
        repo: `${OWNER}/${FEEDBACK_REPO}`,
        state: 'open',
        q,
        sort: `${query.sort}_at`,
        page: query.current,
        per_page: query.pageSize,
        ...processLabels(query.filter),
      },
    },
  )

  return {
    data: issueList.map(val => normalizeIssue(val)),
    ...pagination,
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
): Promise<ForumAPI.Topic> {
  const { data: issueInfo } = await apiCall<GITEE.IssueInfo>(
    'patch',
    `repos/${OWNER}/issues/${number}`,
    {
      searchParams: {
        repo: FEEDBACK_REPO,
        owner: OWNER,
        ...data,
      },
    },
  )

  const result = normalizeIssue(issueInfo)

  // 因为 Gitee 接口不识别无权限用户提交的 labels 和 state，所以这里手动通知 Webhook 同步数据
  if (!(data.labels || data.state))
    return result

  // 团队成员的提交不需要通知 Webhook 同步
  const { hasAnyRoles } = useRuleChecks()
  if (hasAnyRoles('teamMember', 'feedbackMember').value)
    return result

  // 同步失败时向上抛错，由调用方提示
  await reformat({ number })

  return result
}

export async function getUserCreatedTopics(
  query: ForumAPI.Query,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Topic[]>> {
  const { data: issueList, pagination } = await apiCall<GITEE.IssueList>(
    'get',
    `orgs/${OWNER}/issues`,
    {
      searchParams: {
        page: query.current,
        sort: query.sort || 'created',
        per_page: query.pageSize,
        filter: 'created',
        labels: setFilterTags([...query.filter || []]),
        state: 'all',
      },
    },
  )

  return {
    data: issueList
      .filter(
        val =>
          val.repository.full_name
          === `${OWNER}/${FEEDBACK_REPO}`,
      )
      .map(val => normalizeIssue(val)),
    ...pagination,
  }
}

export function openTopicOnGitee(number: string | number) {
  window.open(
    `${GITEE_API_CONFIG.BASE_URL}/${OWNER}/${FEEDBACK_REPO}/issues/${number}`,
  )
}
