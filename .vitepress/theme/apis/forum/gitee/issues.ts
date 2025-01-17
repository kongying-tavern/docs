import { apiCall } from '.'
import { normalizeComment, normalizeIssue, setFilterTags } from './utils'
import { GITEE_API_CONFIG } from './config'

import { extractOfficialAndAuthorComments } from './inBrowserUtils'
import { buildFormData } from '@/apis/utils'

import type ForumAPI from '../api'

export const getTopic = async (number: string): Promise<ForumAPI.Topic> => {
  const [data] = await apiCall<GITEE.IssueInfo>(
    'get',
    `repos/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.REPO}/issues/${number}`,
  )

  return normalizeIssue(data)
}

export const getTopics = async (
  query: ForumAPI.Query,
  state?: ForumAPI.TopicState,
  search?: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Topic[]>> => {
  if (search) return searchTopics(query, search)

  const [[issues, paginationParams], [comments]] = await Promise.all([
    apiCall<GITEE.IssueList>(
      'get',
      `repos/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.REPO}/issues`,
      {
        params: {
          state: state || 'open',
          page: query.current,
          sort: query.sort || 'created',
          per_page: query.pageSize,
          labels: query.filter,
        },
      },
    ),
    apiCall<GITEE.CommentList>(
      'get',
      `repos/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.REPO}/issues/comments`,
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
    `repos/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.REPO}/issues`,
    {
      params: {
        state: 'open',
        labels: ['TYP-ANN'],
      },
      useCache: true,
    },
  )

  return issues.map((issue) => normalizeIssue(issue))
}

export const getTopicComments = async (
  repo: typeof GITEE_API_CONFIG.REPO | typeof GITEE_API_CONFIG.BLOG_REPO,
  query: ForumAPI.Query,
  number: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Comment[]>> => {
  const [commentList, paginationParams] = await apiCall<GITEE.CommentList>(
    'get',
    `repos/${GITEE_API_CONFIG.OWNER}/${repo}/issues/${number}/comments`,
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
        repo: `${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.REPO}`,
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

export const postTopic = async (data: {
  body: string
  title: string
  labels?: string
}): Promise<ForumAPI.Topic> => {
  const form = buildFormData({
    owner: GITEE_API_CONFIG.OWNER,
    repo: GITEE_API_CONFIG.REPO,
    ...data,
  })

  const [issueInfo] = await apiCall<GITEE.IssueInfo>(
    'post',
    `repos/${GITEE_API_CONFIG.OWNER}/issues`,
    {
      body: form,
    },
  )
  console.log(issueInfo)
  return normalizeIssue(issueInfo)
}

export const postTopicComment = async (
  repo: string,
  number: string,
  body: string,
): Promise<ForumAPI.Comment> => {
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

export const deleteIssueComment = async (
  repo: string,
  id: number | string,
): Promise<boolean> => {
  let state = false

  await apiCall<GITEE.IssueList>(
    'delete',
    `repos/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.REPO}/issues/comments/${id}`,
    {
      params: {
        id,
      },
      hooks: {
        afterResponse: [
          async (_input, _options, response) => {
            if (response.status === 204) state = true
            return Promise.resolve()
          },
        ],
      },
    },
  )

  return state
}

export const putTopic = async (
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
    `repos/${GITEE_API_CONFIG.OWNER}/issues/${number}`,
    {
      params: {
        repo: GITEE_API_CONFIG.REPO,
        owner: GITEE_API_CONFIG.OWNER,
        ...data,
      },
    },
  )
  return normalizeIssue(issueInfo)
}

export const getUserCreatedTopics = async (
  query: ForumAPI.Query,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Topic[]>> => {
  const [issueList, paginationParams] = await apiCall<GITEE.IssueList>(
    'get',
    `/orgs/${GITEE_API_CONFIG.OWNER}/issues`,
    {
      params: {
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
    data: issueList
      .filter(
        (val) =>
          val.repository.full_name ===
          GITEE_API_CONFIG.OWNER + '/' + GITEE_API_CONFIG.REPO,
      )
      .map((val) => normalizeIssue(val)),
    ...paginationParams!,
  }
}

export const openTopicOnGitee = (number: string | number) => {
  window.open(
    `https://gitee.com/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.REPO}/issues/${number}`,
  )
}
