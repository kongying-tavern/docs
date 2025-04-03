import type ForumAPI from '../api'
import { apiCall } from '.'

import { GITEE_API_CONFIG } from './config'
import { normalizeUser } from './utils'

export async function getUser(username: string, access_token?: string): Promise<ForumAPI.User> {
  return normalizeUser(
    (
      await apiCall<GITEE.UserInfo>('get', `users/${username}`, {
        params: {
          ...(access_token ? { access_token } : {}),
        },
        useCache: true,
      })
    )[0],
  )
}

export async function getAuthorizedUser(access_token: string): Promise<ForumAPI.User> {
  return normalizeUser(
    (
      await apiCall<GITEE.UserInfo>('get', 'user', { params: { access_token } })
    )[0],
  )
}

export async function getUserOrgs(
  username: string,
  accessToken: string,
  useCache = true,
): Promise<ForumAPI.User> {
  return normalizeUser(
    (
      await apiCall<GITEE.UserInfo>('get', `users/${username}/orgs`, {
        useCache,
      })
    )[0],
  )
}

export async function getOrgMembers(
  accessToken?: string,
  useCache = true,
): Promise<ForumAPI.User[]> {
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
  )[0].map(val => normalizeUser(val))
}

export async function getRepoMembers(
  repo:
    | typeof GITEE_API_CONFIG.FEEDBACK_REPO
    | typeof GITEE_API_CONFIG.BLOG_REPO,
  accessToken?: string,
  useCache = true,
): Promise<ForumAPI.User[]> {
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
  )[0].map(val => normalizeUser(val))
}

export async function getFollowStatus(user: string, targetUser: string, accessToken?: string): Promise<boolean | null> {
  console.log(user, targetUser)
  let state = null
  await apiCall('get', `users/${user}/following/${targetUser}`, {
    params: {
      access_token: accessToken,
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
  })
  return state
}

export async function toggleFollowUser(toggle: boolean, targetUser: string): Promise<boolean | null> {
  let state = null
  await apiCall<boolean>(toggle ? 'put' : 'delete', `user/following/${targetUser}`, {
    hooks: {
      afterResponse: [
        async (_input, _options, response) => {
          if (response.status === 204)
            state = true
          return Promise.resolve()
        },
      ],
    },
  })
  return state
}
