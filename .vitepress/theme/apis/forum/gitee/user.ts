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
  useCache = true,
): Promise<ForumAPI.User[]> => {
  return (
    await apiCall<GITEE.User[]>(
      'get',
      `orgs/${GITEE_API_CONFIG.OWNER}/members`,
      {
        params: {
          per_page: 100,
        },
        useCache,
      },
    )
  )[0].map((val) => normalizeUser(val))
}
