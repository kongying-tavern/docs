import { apiCall } from '.'
import { GITEE_API_CONFIG } from './config'
import type ForumAPI from '../api'
import { normalizeComment, normalizeIssue, processLabels } from './utils'

export const getPosts = async (
  query: ForumAPI.Query,
  accessToken?: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Topic[]>> => {
  const [issues, paginationParams] = await apiCall<GITEE.IssueList>(
    'get',
    `repos/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.BLOG_REPO}/issues`,
    {
      params: {
        state: 'open',
        page: query.current,
        sort: query.sort || 'created',
        per_page: query.pageSize,
        ...(accessToken ? { access_token: accessToken } : {}),
      },
    },
  )

  const data: ForumAPI.Topic[] = issues.map((val) => normalizeIssue(val))

  return {
    data: data,
    ...paginationParams!,
  }
}

export const searchPosts = async (
  query: ForumAPI.Query,
  q: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Topic[]>> => {
  const [issueList, paginationParams] = await apiCall<GITEE.IssueList>(
    'get',
    `search/issues`,
    {
      params: {
        repo: `${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.BLOG_REPO}`,
        state: 'open',
        q: q,
        sort: query.sort + '_at',
        page: query.current,
        per_page: query.pageSize,
        ...processLabels(query.filter),
      },
    },
  )

  return {
    data: issueList.map((val) => normalizeIssue(val)),
    ...paginationParams!,
  }
}

export const getPostComments = async (
  query: ForumAPI.Query,
  number: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Comment[]>> => {
  const [commentList, paginationParams] = await apiCall<GITEE.CommentList>(
    'get',
    `repos/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.BLOG_REPO}/issues/${number}/comments`,
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
