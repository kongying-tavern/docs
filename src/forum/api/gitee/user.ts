import type ForumAPI from '../types'
import { apiCall, deleteApiCache } from '.'
import { GITEE_API_CONFIG } from './config'
import { parseGiteeUser, parseGiteeUsers } from './contracts'
import { normalizeUser } from './normalize'
import { buildUserProfileForm } from './userProfile'

const { OWNER } = GITEE_API_CONFIG

export async function getUser(username: string, accessToken?: string): Promise<ForumAPI.User> {
  const { data } = await apiCall<GITEE.UserInfo>('get', `users/${username}`, {
    searchParams: {
      access_token: accessToken,
    },
    cache: true,
  })

  return normalizeUser(parseGiteeUser(data, `users/${username}`))
}

export async function getAuthorizedUser(accessToken: string): Promise<ForumAPI.User> {
  const { data } = await apiCall<GITEE.UserInfo>('get', 'user', {
    searchParams: { access_token: accessToken },
  })

  return normalizeUser(parseGiteeUser(data, 'user'))
}

export async function updateAuthorizedUser(profile: ForumAPI.UserProfileUpdate): Promise<ForumAPI.User> {
  const { data } = await apiCall<GITEE.UserInfo>('patch', 'user', {
    body: buildUserProfileForm(profile),
  })
  const updated = normalizeUser(parseGiteeUser(data, 'user'))
  deleteApiCache('get', `users/${updated.login}`, { searchParams: {} })
  return updated
}

export async function getOrgMembers(
  accessToken?: string,
  cache = true,
): Promise<ForumAPI.User[]> {
  const { data } = await apiCall<GITEE.User[]>(
    'get',
    `orgs/${OWNER}/members`,
    {
      searchParams: {
        per_page: 100,
        access_token: accessToken,
      },
      cache,
    },
  )

  return parseGiteeUsers(data, `orgs/${OWNER}/members`).map(val => normalizeUser(val))
}

export async function getRepoMembers(
  repo:
    | typeof GITEE_API_CONFIG.FEEDBACK_REPO
    | typeof GITEE_API_CONFIG.BLOG_REPO,
  accessToken?: string,
  cache = true,
): Promise<ForumAPI.User[]> {
  const { data } = await apiCall<GITEE.User[]>(
    'get',
    `repos/${OWNER}/${repo}/collaborators`,
    {
      searchParams: {
        per_page: 100,
        access_token: accessToken,
      },
      cache,
    },
  )

  return parseGiteeUsers(data, `repos/${OWNER}/${repo}/collaborators`).map(val => normalizeUser(val))
}

export async function getFollowStatus(user: string, targetUser: string, accessToken?: string): Promise<boolean | null> {
  try {
    const { response } = await apiCall('get', `users/${user}/following/${targetUser}`, {
      searchParams: {
        access_token: accessToken,
      },
      throwHttpErrors: false,
    })

    // 204: 已关注；404: 未关注；其余状态视为未知
    if (response.status === 204)
      return true
    if (response.status === 404)
      return false
    return null
  }
  catch {
    // 网络错误等异常视为未知状态
    return null
  }
}

export async function toggleFollowUser(toggle: boolean, targetUser: string): Promise<boolean | null> {
  const { response } = await apiCall<boolean>(toggle ? 'put' : 'delete', `user/following/${targetUser}`)

  return response.status === 204
}
