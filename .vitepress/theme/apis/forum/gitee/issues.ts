import { GITEE_OWNER, GITEE_REPO, apiCall, type labels } from '.'
import {
  extractOfficialAndAuthorComments,
  normalizeComment,
  normalizeIssue,
  setFilterTags,
} from './utils'

import type ForumAPI from '../api'

export const getTopic = async (number: string): Promise<ForumAPI.Topic> => {
  const [data] = await apiCall<GITEE.IssueInfo>(
    'get',
    `repos/${GITEE_OWNER}/${GITEE_REPO}/issues/${number}`,
  )

  return normalizeIssue(data)
}

export const getTopics = async (
  query: ForumAPI.Query,
  search?: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Topic[]>> => {
  if (search) return searchTopics(query, search)

  const [[issues, paginationParams], [comments]] = await Promise.all([
    apiCall<GITEE.IssueList>(
      'get',
      `repos/${GITEE_OWNER}/${GITEE_REPO}/issues`,
      {
        params: {
          state: 'open',
          page: query.current,
          sort: query.sort || 'created',
          per_page: query.pageSize,
          labels: query.filter,
        },
      },
    ),
    apiCall<GITEE.CommentList>(
      'get',
      `repos/${GITEE_OWNER}/${GITEE_REPO}/issues/comments`,
      {
        params: {
          page: query.current,
          sort: query.sort || 'created',
          per_page: 100,
        },
      },
    ),
  ])
  const data: ForumAPI.Topic[] = []

  issues.forEach((val) => {
    const topic = normalizeIssue(val)

    if (topic.type === 'ANN') return

    data.push({
      relatedComments: extractOfficialAndAuthorComments(val, comments),
      ...topic,
    })
  })

  return {
    data: data,
    ...paginationParams!,
  }
}

export const getAnnouncementList = async (): Promise<ForumAPI.Topic[]> => {
  const [issues] = await apiCall<GITEE.IssueList>(
    'get',
    `repos/${GITEE_OWNER}/${GITEE_REPO}/issues`,
    {
      params: {
        state: 'open',
        labels: ['ANN'],
      },
      useCache: true,
    },
  )

  return issues.map((issue) => normalizeIssue(issue))
}

export const getTopicComments = async (
  query: ForumAPI.Query,
  number: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Comment[]>> => {
  const [commentList, paginationParams] = await apiCall<GITEE.CommentList>(
    'get',
    `repos/${GITEE_OWNER}/${GITEE_REPO}/issues/${number}/comments`,
    {
      params: {
        number: number,
        page: query.current,
        sort: query.sort || 'created',
        per_page: query.pageSize,
      },
    },
  )
  return {
    data: commentList.map((val) => normalizeComment(val)),
    ...paginationParams!,
  }
}

export const searchTopics = async (
  query: ForumAPI.Query,
  q: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Topic[]>> => {
  const [issueList, paginationParams] = await apiCall<GITEE.IssueList>(
    'get',
    `search/issues`,
    {
      params: {
        repo: `${GITEE_OWNER}/${GITEE_REPO}`,
        state: 'open',
        q: q,
        sort: query.sort + '_at',
        page: query.current,
        per_page: query.pageSize,
        labels: query.filter?.join(','),
      },
    },
  )

  return {
    data: issueList.map((val) => normalizeIssue(val)),
    ...paginationParams!,
  }
}

export const postTopic = async (
  accessToken: ForumAPI.AccessToken,
  data: { body: string; title: string; labels?: string },
): Promise<ForumAPI.Topic> => {
  const [issueInfo] = await apiCall<GITEE.IssueInfo>(
    'post',
    `repos/${GITEE_OWNER}/issues`,
    {
      body: {
        owenr: GITEE_OWNER,
        repo: GITEE_REPO,
        access_token: accessToken,
        ...data,
      },
    },
  )

  return normalizeIssue(issueInfo)
}

export const postTopicComment = async (
  accessToken: string,
  number: string,
  body: string,
): Promise<ForumAPI.Comment> => {
  const [comment] = await apiCall<GITEE.Comment>(
    'post',
    `repos/${GITEE_OWNER}/${GITEE_REPO}/issues/${number}/comments`,
    {
      params: {
        access_token: accessToken,
        number,
        body,
      },
    },
  )

  return normalizeComment(comment)
}

export const deleteIssueComment = async (
  accessToken: string,
  id: number | string,
): Promise<boolean> => {
  let state = false

  await apiCall<GITEE.IssueList>(
    'delete',
    `repos/${GITEE_OWNER}/${GITEE_REPO}/issues/comments/${id}`,
    {
      params: {
        access_token: accessToken,
        id,
      },
      hooks: {
        afterResponse: [
          async (_input, _options, response) => {
            if (response.status === 204) state = true
          },
        ],
      },
    },
  )

  return state
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
  const [issueInfo] = await apiCall<GITEE.IssueInfo>(
    'patch',
    `repos/${GITEE_OWNER}/issues/${number}`,
    {
      params: {
        access_token: accessToken,
        repo: GITEE_REPO,
        owner: GITEE_OWNER,
        ...data,
      },
    },
  )
  return normalizeIssue(issueInfo)
}

export const getUserCreatedTopics = async (
  query: ForumAPI.Query,
  AccessToken: ForumAPI.AccessToken,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Topic[]>> => {
  const [issueList, paginationParams] = await apiCall<GITEE.IssueList>(
    'get',
    `/orgs/${GITEE_OWNER}/issues`,
    {
      params: {
        access_token: AccessToken,
        page: query.current,
        sort: query.sort || 'created',
        per_page: query.pageSize,
        filter: 'created',
        lables: setFilterTags(query.filter),
        state: 'all',
      },
    },
  )

  return {
    data: issueList.map((val) => normalizeIssue(val)),
    ...paginationParams!,
  }
}

export const openTopicOnGitee = (number: string | number) => {
  window.open(`https://gitee.com/KYJGYSDT/Feedback/issues/${number}`)
}
