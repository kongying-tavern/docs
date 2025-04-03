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

export async function getTopic(number: string): Promise<ForumAPI.Topic> {
  const [data] = await apiCall<GITEE.IssueInfo>(
    'get',
    `repos/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.FEEDBACK_REPO}/issues/${number}`,
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

  const [[issues, paginationParams], [comments]] = await Promise.all([
    apiCall<GITEE.IssueList>(
      'get',
      `repos/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.FEEDBACK_REPO}/issues`,
      {
        params: {
          state: state || 'open',
          page: query.current,
          sort: query.sort || 'created',
          per_page: query.pageSize,
          ...(query.creator ? { creator: query.creator } : {}),
          ...processLabels(query.filter),
        },
      },
    ),
    apiCall<GITEE.CommentList>(
      'get',
      `repos/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.FEEDBACK_REPO}/issues/comments`,
      {
        params: {
          page: query.current,
          sort: query.sort || 'created',
          per_page: 100,
        },
        useCache: true,
      },
    ),
  ])
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
    ...paginationParams!,
  }
}

export async function getPinnedList(): Promise<ForumAPI.Topic[]> {
  const [issues] = await apiCall<GITEE.IssueList>(
    'get',
    `repos/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.FEEDBACK_REPO}/issues`,
    {
      params: {
        state: 'open',
        labels: ['PINNED'],
      },
      useCache: true,
    },
  )

  return issues.map(issue => Object.assign(normalizeIssue(issue), { pinned: true }))
}

export async function getAnnouncementList(): Promise<ForumAPI.Topic[]> {
  const [issues] = await apiCall<GITEE.IssueList>(
    'get',
    `repos/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.FEEDBACK_REPO}/issues`,
    {
      params: {
        state: 'open',
        labels: ['TYP-ANN'],
      },
      useCache: true,
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
  const [commentList, paginationParams] = await apiCall<GITEE.CommentList>(
    'get',
    `repos/${GITEE_API_CONFIG.OWNER}/${repo}/issues/${number}/comments`,
    {
      params: {
        number,
        page: query.current,
        sort: query.sort || 'created',
        per_page: query.pageSize,
      },
    },
  )
  return {
    data: commentList.map(val => normalizeComment(val)),
    ...paginationParams!,
  }
}

export async function searchTopics(
  query: ForumAPI.Query,
  q: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Topic[]>> {
  const [issueList, paginationParams] = await apiCall<GITEE.IssueList>(
    'get',
    `search/issues`,
    {
      params: {
        repo: `${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.FEEDBACK_REPO}`,
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
    ...paginationParams!,
  }
}

export async function postTopic(data: {
  body: string
  title: string
  labels?: string
}): Promise<ForumAPI.Topic> {
  const form = buildFormData({
    owner: GITEE_API_CONFIG.OWNER,
    repo: GITEE_API_CONFIG.FEEDBACK_REPO,
    ...data,
  })

  const [issueInfo] = await apiCall<GITEE.IssueInfo>(
    'post',
    `repos/${GITEE_API_CONFIG.OWNER}/issues`,
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
  const [comment] = await apiCall<GITEE.Comment>(
    'post',
    `repos/${GITEE_API_CONFIG.OWNER}/${repo}/issues/${number}/comments`,
    {
      params: {
        number,
        body,
      },
    },
  )

  return normalizeComment(comment)
}

export async function deleteTopicComment(
  id: number | string,
  repo: string = GITEE_API_CONFIG.FEEDBACK_REPO,
): Promise<boolean> {
  let state = false

  await apiCall<GITEE.IssueList>(
    'delete',
    `repos/${GITEE_API_CONFIG.OWNER}/${repo}/issues/comments/${id}`,
    {
      params: {
        id,
      },
      hooks: {
        afterResponse: [
          async (_input, _options, response) => {
            if (response.status === 204)
              state = true
            return Promise.resolve()
          },
        ],
      },
    },
  )

  return state
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
  const [issueInfo] = await apiCall<GITEE.IssueInfo>(
    'patch',
    `repos/${GITEE_API_CONFIG.OWNER}/issues/${number}`,
    {
      params: {
        repo: GITEE_API_CONFIG.FEEDBACK_REPO,
        owner: GITEE_API_CONFIG.OWNER,
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

  const [reformatError] = await reformat({ number })

  if (reformatError)
    Promise.reject(result)

  return result
}

export async function getUserCreatedTopics(
  query: ForumAPI.Query,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Topic[]>> {
  const [issueList, paginationParams] = await apiCall<GITEE.IssueList>(
    'get',
    `/orgs/${GITEE_API_CONFIG.OWNER}/issues`,
    {
      params: {
        page: query.current,
        sort: query.sort || 'created',
        per_page: query.pageSize,
        filter: 'created',
        lables: setFilterTags(Array.from(query.filter || [])),
        state: 'all',
      },
    },
  )

  return {
    data: issueList
      .filter(
        val =>
          val.repository.full_name
          === `${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.FEEDBACK_REPO}`,
      )
      .map(val => normalizeIssue(val)),
    ...paginationParams!,
  }
}

export function openTopicOnGitee(number: string | number) {
  window.open(
    `https://gitee.com/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.FEEDBACK_REPO}/issues/${number}`,
  )
}
