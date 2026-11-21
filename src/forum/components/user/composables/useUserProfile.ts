import type { MaybeRefOrGetter } from 'vue'
import type { FORUM } from '../../types.d.ts'
import { replaceTitle } from '@theme/lib/documentTitle.ts'
import { computed, toValue, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getGiteeMessagesHref } from '@/src/constants/site.ts'
import { useArchivedFeedbackAccess } from '@/src/forum/composables/auth/useArchivedFeedbackAccess.ts'
import { useRuleChecks } from '@/src/forum/composables/auth/useRuleChecks.ts'
import { useForumUserProfileQuery } from '@/src/forum/composables/data/useForumQueries.ts'
import { useUserAuthStore } from '@/src/forum/stores/auth/useUserAuth.ts'
import { useUserInfoStore } from '@/src/forum/stores/auth/useUserInfo.ts'

export function useUserProfile(usernameSource: MaybeRefOrGetter<string>) {
  const username = computed(() => toValue(usernameSource))

  const { t } = useI18n({ useScope: 'global' })
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
        label: t('forum.header.navigation.allFeedback'),
        state: 'open',
      },
      {
        id: 'closed',
        label: t('forum.header.navigation.closedFeedback'),
        state: 'progressing',
      },
    ]
    if (canViewArchived.value) {
      items.push({
        id: 'archived',
        label: t('forum.header.navigation.archivedFeedback'),
        state: 'closed',
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
    replaceTitle(`${newVal.username}${t('forum.labels.personalHomepage')}`)
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
