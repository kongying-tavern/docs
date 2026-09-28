import type ForumAPI from '~/forum/api/types'
import { useQuery, useQueryCache } from '@pinia/colada'
import { computed } from 'vue'
import { useUserAuthStore } from '@/stores/useUserAuth'
import blogMemberListRaw from '~/_data/blogMemberList.json'
import feedbackMemberListRaw from '~/_data/feedbackMemberList.json'
import teamMemberListRaw from '~/_data/teamMemberList.json'
import { user } from '~/forum/api/gitee'
import { GITEE_API_CONFIG } from '~/forum/api/gitee/config'
import { forumKeys } from '~/forum/services/queryContracts'
import { forumLog, ForumLogGroup } from '~/forum/utils/forum-logger'

export interface MemberData {
  id: number
  username: string
  login: string
  avatar: string
  homepage: string
}

export interface MemberDataWithTimestamp {
  data: MemberData[]
  lastUpdated: number
}

export interface PermissionDataState {
  teamMembers: MemberData[]
  feedbackMembers: MemberData[]
  blogMembers: MemberData[]
  loading: boolean
  apiLastUpdated: number | null
  hasApiData: boolean
}

const CACHE_DURATION = 60 * 60 * 1000 // 1小时缓存（query staleTime）
const PERMISSION_CACHE_KEY = ['forum', 'permission']

// 类型转换函数：将 ForumAPI.User 转换为 MemberData
function convertUserToMemberData(users: ForumAPI.User[]): MemberData[] {
  return users.map(user => ({
    id: typeof user.id === 'string' ? Number.parseInt(user.id, 10) : user.id,
    username: user.username,
    login: user.login,
    avatar: user.avatar || '',
    homepage: user.homepage || '',
  }))
}

// 解析本地数据（支持新旧格式）
function parseLocalData(rawData: MemberDataWithTimestamp | MemberData[]): MemberData[] {
  // 新格式：带时间戳的数据
  if (rawData && typeof rawData === 'object' && 'data' in rawData && 'lastUpdated' in rawData) {
    return rawData.data
  }
  // 旧格式：直接是数组
  return rawData as MemberData[]
}

// 获取本地数据的时间戳
function getLocalDataTimestamp(rawData: MemberDataWithTimestamp | MemberData[]): number | null {
  if (rawData && typeof rawData === 'object' && 'lastUpdated' in rawData) {
    return rawData.lastUpdated
  }
  return null
}

/** API 返回（Gitee 用户形状）与本地 JSON（已转换形状）二选一收敛为 MemberData[] */
function toMemberData(raw: unknown): MemberData[] {
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object' && raw[0] !== null && 'avatar' in raw[0])
    return convertUserToMemberData(raw as ForumAPI.User[])
  return raw as MemberData[]
}

/**
 * 拉取一组成员。无 token 或请求失败时降级到构建期本地 JSON；
 * 本地 JSON 时间戳意外较新时同样让位本地数据（沿用原实现的择优语义）。
 */
async function fetchMembers(options: {
  accessToken?: string
  fetch: () => Promise<ForumAPI.User[]>
  localRaw: MemberDataWithTimestamp | MemberData[]
}): Promise<MemberData[]> {
  const { accessToken, fetch, localRaw } = options
  if (!accessToken) {
    forumLog.warn(ForumLogGroup.PERMISSION, '无访问令牌，使用本地权限数据')
    return parseLocalData(localRaw)
  }

  try {
    const apiTimestamp = Date.now()
    const localTimestamp = getLocalDataTimestamp(localRaw)
    const useApi = !localTimestamp || apiTimestamp > localTimestamp
    if (!useApi)
      return parseLocalData(localRaw)

    return toMemberData(await fetch())
  }
  catch (error) {
    forumLog.warn(ForumLogGroup.PERMISSION, '获取权限数据失败，使用本地数据', error)
    return parseLocalData(localRaw)
  }
}

export function usePermissionData() {
  const userAuth = useUserAuthStore()
  const queryCache = useQueryCache()

  const isLoggedIn = computed(() => userAuth.isTokenValid)

  const teamQuery = useQuery({
    key: forumKeys.permission('team'),
    // 未登录不取数（本地 JSON 兜底渲染）；登录后 enabled 翻转，colada 自动发起取数，
    // 单 key 单飞，无需手动 watch 登录事件
    enabled: isLoggedIn,
    query: () => fetchMembers({
      accessToken: userAuth.auth?.accessToken,
      fetch: () => user.getOrgMembers(userAuth.auth?.accessToken),
      localRaw: teamMemberListRaw,
    }),
    staleTime: CACHE_DURATION,
  })

  const feedbackQuery = useQuery({
    key: forumKeys.permission('feedback'),
    enabled: isLoggedIn,
    query: () => fetchMembers({
      accessToken: userAuth.auth?.accessToken,
      fetch: () => user.getRepoMembers(GITEE_API_CONFIG.FEEDBACK_REPO, userAuth.auth?.accessToken),
      localRaw: feedbackMemberListRaw,
    }),
    staleTime: CACHE_DURATION,
  })

  const blogQuery = useQuery({
    key: forumKeys.permission('blog'),
    enabled: isLoggedIn,
    query: () => fetchMembers({
      accessToken: userAuth.auth?.accessToken,
      fetch: () => user.getRepoMembers(GITEE_API_CONFIG.BLOG_REPO, userAuth.auth?.accessToken),
      localRaw: blogMemberListRaw,
    }),
    staleTime: CACHE_DURATION,
  })

  // 查询未就绪时以本地 JSON 兜底，保持首帧同步可用（原实现的初始状态语义）
  const teamMembers = computed(() => teamQuery.data.value ?? parseLocalData(teamMemberListRaw))
  const feedbackMembers = computed(() => feedbackQuery.data.value ?? parseLocalData(feedbackMemberListRaw))
  const blogMembers = computed(() => blogQuery.data.value ?? parseLocalData(blogMemberListRaw))

  const getTeamMemberIds = computed(() =>
    new Set(teamMembers.value.map(member => member.id)),
  )

  const getFeedbackMemberIds = computed(() =>
    new Set(feedbackMembers.value.map(member => member.id)),
  )

  const getBlogMemberIds = computed(() =>
    new Set(blogMembers.value.map(member => member.id)),
  )

  // apiLastUpdated/hasApiData 为兼容旧形状保留；新代码请读各 query 状态
  const permissionData = computed<PermissionDataState>(() => {
    const entries = queryCache.getEntries({ key: PERMISSION_CACHE_KEY })
    const apiLastUpdated = entries.reduce((latest, entry) => Math.max(latest, entry.when), 0)
    return {
      teamMembers: teamMembers.value,
      feedbackMembers: feedbackMembers.value,
      blogMembers: blogMembers.value,
      loading: teamQuery.isLoading.value || feedbackQuery.isLoading.value || blogQuery.isLoading.value,
      apiLastUpdated: apiLastUpdated || null,
      hasApiData: apiLastUpdated > 0,
    }
  })

  async function refreshPermissionData(): Promise<void> {
    if (!isLoggedIn.value)
      return
    await Promise.all([
      teamQuery.refetch(),
      feedbackQuery.refetch(),
      blogQuery.refetch(),
    ])
  }

  // 登录/登出由各 query 的 enabled 门控处理（colada 内置 watch(enabled)），
  // 不在此注册登录 watcher：多个消费方实例化本组合函数时会产生多份 watcher，
  // 而 colada 的 refetch 并不单飞（fetch 会 abort 上一笔再重启），会造成请求抖动。

  /** 仅当数据缺失或超过 staleTime 时才真正重取（保持原实现的节流语义） */
  async function ensureFreshData(): Promise<void> {
    if (!isLoggedIn.value)
      return
    const freshest = queryCache
      .getEntries({ key: PERMISSION_CACHE_KEY })
      .reduce((latest, entry) => Math.max(latest, entry.when), 0)
    if (!freshest || Date.now() - freshest > CACHE_DURATION)
      await refreshPermissionData()
  }

  return {
    // 状态
    permissionData,
    isLoggedIn,

    // 获取器
    getTeamMemberIds,
    getFeedbackMemberIds,
    getBlogMemberIds,

    // 方法
    refreshPermissionData,
    ensureFreshData,
  }
}
