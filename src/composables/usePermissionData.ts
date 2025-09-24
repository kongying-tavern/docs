import type ForumAPI from '@/apis/forum/api'
import { computed, ref, watch } from 'vue'
import { user } from '@/apis/forum/gitee'
import { GITEE_API_CONFIG } from '@/apis/forum/gitee/config'
import { useUserAuthStore } from '@/stores/useUserAuth'
import blogMemberListRaw from '~/_data/blogMemberList.json'
import feedbackMemberListRaw from '~/_data/feedbackMemberList.json'
import teamMemberListRaw from '~/_data/teamMemberList.json'

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
  hasApiData: boolean // 标记是否已经从API获取过数据
}

const CACHE_DURATION = 60 * 60 * 1000 // 1小时缓存

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

// 全局状态管理
const permissionDataState = ref<PermissionDataState>({
  teamMembers: parseLocalData(teamMemberListRaw),
  feedbackMembers: parseLocalData(feedbackMemberListRaw),
  blogMembers: parseLocalData(blogMemberListRaw),
  loading: false,
  apiLastUpdated: null,
  hasApiData: false,
})

// 全局单例，确保只设置一次监听器
let isWatcherSetup = false

export function usePermissionData() {
  const userAuth = useUserAuthStore()

  const isLoggedIn = computed(() => userAuth.isTokenValid)

  const shouldRefreshData = computed(() => {
    // 只要用户已登录就可以尝试刷新
    if (!isLoggedIn.value)
      return false

    // 如果从未通过API获取过数据，需要刷新
    if (!permissionDataState.value.hasApiData)
      return true

    // 检查是否超过缓存时间
    const now = Date.now()
    const elapsed = now - (permissionDataState.value.apiLastUpdated || 0)
    return elapsed > CACHE_DURATION
  })

  const fetchMemberData = async () => {
    if (permissionDataState.value.loading)
      return

    const accessToken = userAuth.auth?.accessToken
    if (!accessToken) {
      console.warn('无访问令牌，使用本地权限数据')
      return
    }

    permissionDataState.value.loading = true

    try {
      const [teamMembersRaw, feedbackMembersRaw, blogMembersRaw] = await Promise.all([
        user.getOrgMembers(accessToken).catch(() => parseLocalData(teamMemberListRaw)),
        user.getRepoMembers(GITEE_API_CONFIG.FEEDBACK_REPO, accessToken).catch(() => parseLocalData(feedbackMemberListRaw)),
        user.getRepoMembers(GITEE_API_CONFIG.BLOG_REPO, accessToken).catch(() => parseLocalData(blogMemberListRaw)),
      ])

      const teamMembers = Array.isArray(teamMembersRaw) && teamMembersRaw.length > 0 && 'avatar' in teamMembersRaw[0]
        ? convertUserToMemberData(teamMembersRaw as ForumAPI.User[])
        : teamMembersRaw as MemberData[]

      const feedbackMembers = Array.isArray(feedbackMembersRaw) && feedbackMembersRaw.length > 0 && 'avatar' in feedbackMembersRaw[0]
        ? convertUserToMemberData(feedbackMembersRaw as ForumAPI.User[])
        : feedbackMembersRaw as MemberData[]

      const blogMembers = Array.isArray(blogMembersRaw) && blogMembersRaw.length > 0 && 'avatar' in blogMembersRaw[0]
        ? convertUserToMemberData(blogMembersRaw as ForumAPI.User[])
        : blogMembersRaw as MemberData[]

      const apiTimestamp = Date.now()

      // 分别处理每种数据类型
      const teamTimestamp = getLocalDataTimestamp(teamMemberListRaw)
      const feedbackTimestamp = getLocalDataTimestamp(feedbackMemberListRaw)
      const blogTimestamp = getLocalDataTimestamp(blogMemberListRaw)

      const useTeamApi = !teamTimestamp || apiTimestamp > teamTimestamp
      const useFeedbackApi = !feedbackTimestamp || apiTimestamp > feedbackTimestamp
      const useBlogApi = !blogTimestamp || apiTimestamp > blogTimestamp

      permissionDataState.value = {
        teamMembers: useTeamApi ? teamMembers : parseLocalData(teamMemberListRaw),
        feedbackMembers: useFeedbackApi ? feedbackMembers : parseLocalData(feedbackMemberListRaw),
        blogMembers: useBlogApi ? blogMembers : parseLocalData(blogMemberListRaw),
        loading: false,
        apiLastUpdated: apiTimestamp,
        hasApiData: true,
      }

      console.info('权限数据更新完成', {
        teamMembers: useTeamApi ? 'API数据' : '本地数据',
        feedbackMembers: useFeedbackApi ? 'API数据' : '本地数据',
        blogMembers: useBlogApi ? 'API数据' : '本地数据',
      })
    }
    catch (error) {
      console.warn('获取权限数据失败，使用本地数据:', error)
      permissionDataState.value.loading = false
    }
  }

  const refreshPermissionData = async () => {
    if (isLoggedIn.value) {
      await fetchMemberData()
    }
  }

  // 自动刷新逻辑
  const ensureFreshData = async () => {
    if (shouldRefreshData.value) {
      await refreshPermissionData()
    }
  }

  const getTeamMemberIds = computed(() =>
    new Set(permissionDataState.value.teamMembers.map(member => member.id)),
  )

  const getFeedbackMemberIds = computed(() =>
    new Set(permissionDataState.value.feedbackMembers.map(member => member.id)),
  )

  const getBlogMemberIds = computed(() =>
    new Set(permissionDataState.value.blogMembers.map(member => member.id)),
  )

  // 设置监听器，在用户登录时自动刷新权限数据
  if (!isWatcherSetup) {
    isWatcherSetup = true

    // 监听登录状态变化
    watch(isLoggedIn, async (newValue, oldValue) => {
      // 从未登录变为登录时，立即刷新权限数据
      if (newValue && !oldValue) {
        console.info('用户登录，刷新权限数据')
        await refreshPermissionData()
      }
    }, { immediate: false })

    // 定时检查是否需要刷新（每10分钟检查一次）
    setInterval(() => {
      if (shouldRefreshData.value) {
        console.info('权限数据已过期，自动刷新')
        refreshPermissionData()
      }
    }, 10 * 60 * 1000) // 10分钟检查间隔
  }

  return {
    // 状态
    permissionData: computed(() => permissionDataState.value),
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
