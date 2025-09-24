import { useData, useRouter, withBase } from 'vitepress'
import { computed, ref, watch } from 'vue'
import { useRequest } from 'vue-request'
import { toast } from 'vue-sonner'
import { user } from '@/apis/forum/gitee'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { getLangPath } from '@/utils'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { setPageTitle } from '../../utils'

export interface UseUserProfileOptions {
  username: string
  topicCount: number
}

export function useUserProfile(options: UseUserProfileOptions) {
  const { username } = options

  // Composables
  const { go } = useRouter()
  const { localeIndex } = useData()
  const { message } = useLocalized()
  const userInfo = useUserInfoStore()
  const userAuth = useUserAuthStore()
  const { isOfficial } = useRuleChecks()

  // State
  const menuRef = ref<HTMLElement | null>(null)

  // User data request
  const { runAsync: getUser, data: userData } = useRequest(user.getUser, {
    manual: true,
    onError: (err) => {
      toast.error(`${message.value.forum.labels.fetchUserFailed} (${err})`)

      if (err.message.includes('404 Not Found')) {
        return go(withBase(`${getLangPath(localeIndex.value)}404.html`))
      }
    },
  })

  // Load user data if needed
  async function loadUserData(): Promise<void> {
    if (!userInfo.info || userInfo?.info.username !== username || userInfo?.info.login !== username) {
      await getUser(username, userAuth.isTokenValid ? userAuth.auth?.accessToken : undefined)
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
