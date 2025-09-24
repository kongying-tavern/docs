import type ForumAPI from '../api'
import { buildFormData } from '@/apis/utils'
import { apiCall } from '.'
import { GITEE_API_CONFIG } from './config'
import { normalizeComment, normalizeIssueToBlog, processLabels } from './utils'

export async function getPosts(
  query: ForumAPI.Query,
  accessToken?: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Post[]>> {
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

  const data: ForumAPI.Post[] = issues.map(val => normalizeIssueToBlog(val))

  return {
    data,
    ...paginationParams!,
  }
}

export async function searchPosts(
  query: ForumAPI.Query,
  q: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Post[]>> {
  const [issueList, paginationParams] = await apiCall<GITEE.IssueList>(
    'get',
    `search/issues`,
    {
      params: {
        repo: `${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.BLOG_REPO}`,
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
    data: issueList.map(val => normalizeIssueToBlog(val)),
    ...paginationParams!,
  }
}

export async function getPostComments(
  query: ForumAPI.Query,
  number: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Comment[]>> {
  const [commentList, paginationParams] = await apiCall<GITEE.CommentList>(
    'get',
    `repos/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.BLOG_REPO}/issues/${number}/comments`,
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

export async function createBlogPost(data: {
  title: string
  body: string
  labels?: string[]
}): Promise<ForumAPI.Post> {
  const form = buildFormData({
    owner: GITEE_API_CONFIG.OWNER,
    repo: GITEE_API_CONFIG.BLOG_REPO,
    ...data,
  })

  const [issueInfo] = await apiCall<GITEE.IssueInfo>(
    'post',
    `repos/${GITEE_API_CONFIG.OWNER}/issues`,
    {
      body: form,
    },
  )

  return normalizeIssueToBlog(issueInfo)
}

export async function updateBlogPost(
  number: string | number,
  data: {
    title?: string
    body?: string
    labels?: string
    state?: ForumAPI.TopicState
  },
): Promise<ForumAPI.Post> {
  const [issueInfo] = await apiCall<GITEE.IssueInfo>(
    'patch',
    `repos/${GITEE_API_CONFIG.OWNER}/issues/${number}`,
    {
      params: {
        repo: GITEE_API_CONFIG.BLOG_REPO,
        owner: GITEE_API_CONFIG.OWNER,
        ...data,
      },
    },
  )

  return normalizeIssueToBlog(issueInfo)
}

export async function getPost(
  number: string | number,
  accessToken?: string,
): Promise<ForumAPI.Post> {
  const [issueInfo] = await apiCall<GITEE.IssueInfo>(
    'get',
    `repos/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.BLOG_REPO}/issues/${number}`,
    {
      params: {
        ...(accessToken ? { access_token: accessToken } : {}),
      },
    },
  )

  return normalizeIssueToBlog(issueInfo)
}

export async function deleteBlogPost(
  number: string | number,
): Promise<boolean> {
  try {
    await updateBlogPost(number, { state: 'closed' })
    return true
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.error('删除博客失败:', error)
    return false
  }
}

export function openInGitee(id: string | number) {
  return window.open(`https://gitee.com/${GITEE_API_CONFIG.OWNER}/${GITEE_API_CONFIG.BLOG_REPO}/issues/${id}`, '_black')
}
