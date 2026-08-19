import type ForumAPI from '../api'
import { buildFormData } from '@/apis/utils'
import { apiCall } from '.'
import { GITEE_API_CONFIG } from './config'
import { normalizeComment, normalizeIssueToBlog, processLabels } from './utils'

const { OWNER, BLOG_REPO } = GITEE_API_CONFIG

export async function getPosts(
  query: ForumAPI.Query,
  accessToken?: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Post[]>> {
  const { data: issues, pagination } = await apiCall<GITEE.IssueList>(
    'get',
    `repos/${OWNER}/${BLOG_REPO}/issues`,
    {
      searchParams: {
        state: 'open',
        page: query.current,
        sort: query.sort || 'created',
        per_page: query.pageSize,
        access_token: accessToken,
      },
    },
  )

  return {
    data: issues.map(val => normalizeIssueToBlog(val)),
    ...pagination,
  }
}

export async function searchPosts(
  query: ForumAPI.Query,
  q: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Post[]>> {
  const { data: issueList, pagination } = await apiCall<GITEE.IssueList>(
    'get',
    `search/issues`,
    {
      searchParams: {
        repo: `${OWNER}/${BLOG_REPO}`,
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
    ...pagination,
  }
}

export async function getPostComments(
  query: ForumAPI.Query,
  number: string,
): Promise<ForumAPI.PaginatedResult<ForumAPI.Comment[]>> {
  const { data: commentList, pagination } = await apiCall<GITEE.CommentList>(
    'get',
    `repos/${OWNER}/${BLOG_REPO}/issues/${number}/comments`,
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

export async function createBlogPost(data: {
  title: string
  body: string
  labels?: string[]
}): Promise<ForumAPI.Post> {
  const form = buildFormData({
    owner: OWNER,
    repo: BLOG_REPO,
    ...data,
  })

  const { data: issueInfo } = await apiCall<GITEE.IssueInfo>(
    'post',
    `repos/${OWNER}/issues`,
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
  const { data: issueInfo } = await apiCall<GITEE.IssueInfo>(
    'patch',
    `repos/${OWNER}/issues/${number}`,
    {
      searchParams: {
        repo: BLOG_REPO,
        owner: OWNER,
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
  const { data: issueInfo } = await apiCall<GITEE.IssueInfo>(
    'get',
    `repos/${OWNER}/${BLOG_REPO}/issues/${number}`,
    {
      searchParams: {
        access_token: accessToken,
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
  return window.open(`${GITEE_API_CONFIG.BASE_URL}/${OWNER}/${BLOG_REPO}/issues/${id}`, '_blank')
}
