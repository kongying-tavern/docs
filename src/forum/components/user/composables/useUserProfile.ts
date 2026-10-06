import type { MaybeRefOrGetter } from 'vue'
import type { FORUM } from '../../types'
import { computed, toValue, watch } from 'vue'
import { replaceTitle } from '@/composables/replaceTitle'
import { useLocalized } from '@/hooks/useLocalized'
import { getGiteeMessagesHref } from '~/constants/site'
import { useArchivedFeedbackAccess } from '~/forum/composables/auth/useArchivedFeedbackAccess'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useForumUserProfileQuery } from '~/forum/composables/data/useForumQueries'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'

export function useUserProfile(usernameSource: MaybeRefOrGetter<string>) {
  const username = computed(() => toValue(usernameSource))

  const { message } = useLocalized()
  const userInfo = useUserInfoStore()
  const userAuth = useUserAuthStore()
  const { isOfficial } = useRuleChecks()

  const profileQuery = useForumUserProfileQuery(
    username,
    computed(() => userAuth.isTokenValid ? userAuth.auth?.accessToken : undefined),
  )

  const renderedUser = computed(() => userAuth.isLoggedIn && userInfo.info?.login === username.value
    ? userInfo.info
    : profileQuery.data.value)

  const role = computed(() => (isOfficial(renderedUser.value?.id || 0).value ? 'official' : null))
  const isAuthorizedUser = computed(() => Boolean(
    userAuth.isLoggedIn && renderedUser.value?.id
    && String(renderedUser.value.id) === String(userInfo.info?.id),
  ))

  const canViewArchived = useArchivedFeedbackAccess(username)

  const menu = computed<FORUM.ProfileTab[]>(() => {
    const items: FORUM.ProfileTab[] = [
      {
        id: 'all',
        label: message.value.forum.header.navigation.allFeedback,
        icon: 'i-lucide-file-text',
      },
      {
        id: 'closed',
        label: message.value.forum.header.navigation.closedFeedback,
        icon: 'i-lucide-circle-check',
      },
    ]
    if (canViewArchived.value) {
      items.push({
        id: 'archived',
        label: message.value.forum.header.navigation.archivedFeedback,
        icon: 'i-lucide-circle-off',
      })
    }
    return items
  })

  function sendMessage(): void {
    window.open(getGiteeMessagesHref(renderedUser.value!.id), String(renderedUser.value?.id))
  }

  watch(renderedUser, (newVal) => {
    if (!newVal)
      return
    replaceTitle(`${newVal.username}${message.value.forum.labels.personalHomepage}`)
  }, {
    immediate: true,
  })

  return {
    userData: profileQuery.data,
    loading: profileQuery.isLoading,
    error: profileQuery.error,

    renderedUser,
    role,
    isAuthorizedUser,
    menu,

    retry: profileQuery.refetch,
    sendMessage,
  }
}
