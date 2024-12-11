import { apiCall, GITEE_OWNER, GITEE_REPO } from '.'
import { getGiteePaginationParams } from '../../utils'
import {
  extractOfficialAndAuthorComments,
  normalizeComment,
  normalizeIssue,
  pinnedAnn,
} from './utils'

import type ForumAPI from '../api'

export const getTopic = async (number: string): Promise<ForumAPI.Topic> => {
  const response = await apiCall<GITEE.IssueInfo>(
    'get',
    `repos/${GITEE_OWNER}/${GITEE_REPO}/issues/${number}`,
  )

  return normalizeIssue(await response.json())
}

export const getTopics = async (
  query: ForumAPI.Query,
  search?: string,
): Promise<ForumAPI.PaginationParams<ForumAPI.Topic[]>> => {
  if (search) return searchTopics(query, search)

  const [issues, comments] = await Promise.all([
    apiCall<GITEE.IssueList>(
      'get',
      `repos/${GITEE_OWNER}/${GITEE_REPO}/issues`,
      {
        state: 'open',
        page: query.current,
        sort: query.sort || 'created',
        per_page: query.pageSize,
      },
    ),
    apiCall<GITEE.CommentList>(
      'get',
      `repos/${GITEE_OWNER}/${GITEE_REPO}/issues/comments`,
      {
        page: query.current,
        sort: query.sort || 'created',
        per_page: query.pageSize,
      },
    ),
  ])

  const issuesData = await issues.json()
  const commets = await comments.json()

  return {
    data: pinnedAnn(
      issuesData.map((val) => {
        return {
          importantComments: extractOfficialAndAuthorComments(val, commets),
          ...normalizeIssue(val),
        }
      }),
    ),
    ...getGiteePaginationParams(issues),
  }
}

export const getTopicComments = async (
  query: ForumAPI.Query,
  number: string,
): Promise<ForumAPI.PaginationParams<ForumAPI.Comment[]>> => {
  const response = await apiCall<GITEE.CommentList>(
    'get',
    `repos/${GITEE_OWNER}/${GITEE_REPO}/issues/${number}/comments`,
    {
      number: number,
      page: query.current,
      sort: query.sort || 'created',
      per_page: query.pageSize,
    },
  )
  return {
    data: (await response.json()).map((val) => normalizeComment(val)),
    ...getGiteePaginationParams(response),
  }
}

export const searchTopics = async (
  query: ForumAPI.Query,
  q: string,
): Promise<ForumAPI.PaginationParams<ForumAPI.Topic[]>> => {
  const response = await apiCall<GITEE.IssueList>('get', `search/issues`, {
    repo: `${GITEE_OWNER}/${GITEE_REPO}`,
    state: 'open',
    q: q,
    sort: query.sort + '_at',
    page: query.current,
    per_page: query.pageSize,
  })
  return {
    data: (await response.json()).map((val) => normalizeIssue(val)),
    ...getGiteePaginationParams(response),
  }
}

export const postTopic = async (
  accessToken: ForumAPI.AccessToken,
  data: { body: string; title: string; labels?: string },
): Promise<ForumAPI.Topic> => {
  const response = await apiCall<GITEE.IssueInfo>(
    'post',
    `repos/${GITEE_OWNER}/issues`,
    undefined,
    {
      owenr: GITEE_OWNER,
      repo: GITEE_REPO,
      access_token: accessToken,
      ...data,
    },
  )

  return normalizeIssue(await response.json())
}

export const postTopicComment = async (
  accessToken: string,
  number: string,
  body: string,
): Promise<ForumAPI.Comment> => {
  const response = await apiCall<GITEE.Comment>(
    'post',
    `repos/${GITEE_OWNER}/${GITEE_REPO}/issues/${number}/comments`,
    undefined,
    {
      access_token: accessToken,
      number,
      body,
    },
  )

  return normalizeComment(await response.json())
}

export const deleteIssueComment = async (
  accessToken: string,
  id: number | string,
): Promise<Boolean> => {
  const response = await apiCall<GITEE.IssueList>(
    'delete',
    `repos/${GITEE_OWNER}/${GITEE_REPO}/issues/comments/${id}`,
    {
      access_token: accessToken,
      id,
    },
  )

  return response.status === 204
}

export const putTopic = async (
  accessToken: string,
  number: string | number,
  data: {
    title?: string
    body?: string
    labels?: string
    state?: ForumAPI.TopicState
  },
): Promise<ForumAPI.Topic> => {
  const response = await apiCall<GITEE.IssueList>(
    'patch',
    `repos/${GITEE_OWNER}/issues/${number}`,
    {
      access_token: accessToken,
      repo: GITEE_REPO,
      owner: GITEE_OWNER,
      ...data,
    },
  )
  return normalizeIssue(await response.json())
}

export const getUserCreatedTopics = async (
  query: ForumAPI.Query,
  AccessToken: ForumAPI.AccessToken,
): Promise<ForumAPI.PaginationParams<ForumAPI.Topic[]>> => {
  const response = await apiCall<GITEE.IssueList>(
    'get',
    `/orgs/${GITEE_OWNER}/issues`,
    {
      access_token: AccessToken,
      page: query.current,
      sort: query.sort || 'created',
      per_page: query.pageSize,
      filter: 'created',
      state: 'all',
    },
  )

  const data = await response.json()

  return {
    data: data.map((val) => normalizeIssue(val)),
    ...getGiteePaginationParams(response),
  }
}

export const openTopicOnGitee = (number: string | number) => {
  window.open(`https://gitee.com/KYJGYSDT/Feedback/issues/${number}`)
}
