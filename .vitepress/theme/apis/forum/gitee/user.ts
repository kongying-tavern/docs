import { GITEE_OWNER, apiCall } from '.'
import type ForumAPI from '../api'
import { normalizeUser } from './utils'

export const getUser = async (access_token: string): Promise<ForumAPI.User> => {
  return normalizeUser(
    await (
      await apiCall<GITEE.UserInfo>('get', 'user', { access_token })
    ).json(),
  )
}

export const getUserOrgs = async (username: string): Promise<ForumAPI.User> => {
  return normalizeUser(
    await (
      await apiCall<GITEE.UserInfo>('get', `users/${username}/orgs`)
    ).json(),
  )
}

export const getOrgMembers = async (): Promise<ForumAPI.User[]> => {
  return (
    await (
      await apiCall<GITEE.User[]>('get', `orgs/${GITEE_OWNER}/members`, {
        per_page: 100,
      })
    ).json()
  ).map((val) => normalizeUser(val))
}
