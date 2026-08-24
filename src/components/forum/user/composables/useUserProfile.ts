import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useForumUserProfileQuery } from '~/composables/forum/useForumQueries'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { setPageTitle } from '../../utils'

export interface UseUserProfileOptions {
  username: MaybeRefOrGetter<string>
}

export function useUserProfile(options: UseUserProfileOptions) {
  const username = computed(() => toValue(options.username))

  // Composables
  const { message } = useLocalized()
  const userInfo = useUserInfoStore()
  const userAuth = useUserAuthStore()
  const { isOfficial } = useRuleChecks()

  // State
  const menuRef = ref<HTMLElement | null>(null)

  const profileQuery = useForumUserProfileQuery(
    username,
    computed(() => userAuth.isTokenValid ? userAuth.auth?.accessToken : undefined),
  )

  // Computed properties
  const renderedUser = computed(() => profileQuery.data.value)

  const role = computed(() => (isOfficial(renderedUser.value?.id || 0).value ? 'official' : null))
  const isAuthorizedUser = computed(() => username.value === userInfo.info?.username || username.value === userInfo.info?.login)

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
    userData: profileQuery.data,
    loading: profileQuery.isLoading,
    error: profileQuery.error,

    // Computed
    renderedUser,
    role,
    isAuthorizedUser,
    menu,

    // Actions
    retry: profileQuery.refetch,
    sendMessage,
  }
}
