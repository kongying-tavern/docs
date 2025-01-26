import { apiCall } from '.'
import { GITEE_API_CONFIG } from './config'
import { normalizeUser } from './utils'

import type ForumAPI from '../api'

export const getUser = async (access_token: string): Promise<ForumAPI.User> => {
  return normalizeUser(
    (
      await apiCall<GITEE.UserInfo>('get', 'user', { params: { access_token } })
    )[0],
  )
}

export const getUserOrgs = async (
  username: string,
  accessToken: string,
  useCache = true,
): Promise<ForumAPI.User> => {
  return normalizeUser(
    (
      await apiCall<GITEE.UserInfo>('get', `users/${username}/orgs`, {
        useCache,
      })
    )[0],
  )
}

export const getOrgMembers = async (
  accessToken?: string,
  useCache = true,
): Promise<ForumAPI.User[]> => {
  return (
    await apiCall<GITEE.User[]>(
      'get',
      `orgs/${GITEE_API_CONFIG.OWNER}/members`,
      {
        params: {
          per_page: 100,
          ...(accessToken ? { access_token: accessToken } : {}),
        },
        useCache,
      },
    )
  )[0].map((val) => normalizeUser(val))
}

export const getRepoMembers = async (
  repo:
    | typeof GITEE_API_CONFIG.FEEDBACK_REPO
    | typeof GITEE_API_CONFIG.BLOG_REPO,
  accessToken?: string,
  useCache = true,
): Promise<ForumAPI.User[]> => {
  return (
    await apiCall<GITEE.User[]>(
      'get',
      `repos/${GITEE_API_CONFIG.OWNER}/${repo}/collaborators`,
      {
        params: {
          per_page: 100,
          ...(accessToken ? { access_token: accessToken } : {}),
        },
        useCache,
      },
    )
  )[0].map((val) => normalizeUser(val))
}
