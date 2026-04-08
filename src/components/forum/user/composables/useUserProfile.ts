import { useQuery } from '@pinia/colada'
import { computed, ref, watch } from 'vue'
import { user } from '@/apis/forum/gitee'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { setPageTitle } from '../../utils'

export interface UseUserProfileOptions {
  username: string
  topicCount: number
}

export function useUserProfile(options: UseUserProfileOptions) {
  const { username } = options

  // Composables
  const { message } = useLocalized()
  const userInfo = useUserInfoStore()
  const userAuth = useUserAuthStore()
  const { isOfficial } = useRuleChecks()

  // State
  const menuRef = ref<HTMLElement | null>(null)

  // User data request - useQuery
  const { data: userData, refetch: getUser } = useQuery({
    key: () => ['user', username] as const,
    query: () => user.getUser(username, userAuth.isTokenValid ? userAuth.auth?.accessToken : undefined),
    enabled: () => !userInfo.info || userInfo.info.username !== username || userInfo.info.login !== username,
    staleTime: 1000 * 60 * 5, // 5分钟内不重新请求
  })

  // Load user data if needed
  async function loadUserData(): Promise<void> {
    if (!userInfo.info || userInfo?.info.username !== username || userInfo?.info.login !== username) {
      await getUser()
    }
  }

  // Computed properties
  const renderedUser = computed(() => {
    if (userInfo.info && userInfo.info.username === username) {
      return userInfo.info
    }
    else {
      return userData.value
    }
  })

  const role = computed(() => (isOfficial(renderedUser.value?.id || 0).value ? 'official' : null))
  const isAuthorizedUser = computed(() => username === userInfo.info?.username || username === userInfo.info?.login)

  const menu = computed<{
    id: string
    label: string
    icon: string
  }[]>(() => {
    return [
      {
        id: 'feedback',
        label: isAuthorizedUser.value ? message.value.forum.labels.myFeedback : message.value.forum.labels.submittedFeedback,
        icon: 'i-lucide-file-text',
      },
    ]
  })

  // Actions
  function sendMessage(): void {
    window.open(`https://gitee.com/notifications/messages/${renderedUser.value?.id}`, String(renderedUser.value?.id))
  }

  // Watch for user changes to update page title
  watch(renderedUser, (newVal) => {
    if (!newVal)
      return
    setPageTitle(`${newVal.username} 的个人主页`)
  }, {
    immediate: true,
  })

  return {
    // State
    menuRef,
    userData,

    // Computed
    renderedUser,
    role,
    isAuthorizedUser,
    menu,

    // Actions
    loadUserData,
    sendMessage,
  }
}
