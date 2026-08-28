import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue, watch } from 'vue'
import { replaceTitle } from '@/composables/replaceTitle'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useForumUserProfileQuery } from '~/composables/forum/useForumQueries'
import { useRuleChecks } from '~/composables/useRuleChecks'

export function useUserProfile(usernameSource: MaybeRefOrGetter<string>) {
  const username = computed(() => toValue(usernameSource))

  const { message } = useLocalized()
  const userInfo = useUserInfoStore()
  const userAuth = useUserAuthStore()
  const { isOfficial } = useRuleChecks()

  const menuRef = ref<HTMLElement | null>(null)

  const profileQuery = useForumUserProfileQuery(
    username,
    computed(() => userAuth.isTokenValid ? userAuth.auth?.accessToken : undefined),
  )

  const renderedUser = computed(() => profileQuery.data.value)

  const role = computed(() => (isOfficial(renderedUser.value?.id || 0).value ? 'official' : null))
  const isAuthorizedUser = computed(() => Boolean(
    renderedUser.value?.id
    && String(renderedUser.value.id) === String(userInfo.info?.id),
  ))

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

  function sendMessage(): void {
    window.open(`https://gitee.com/notifications/messages/${renderedUser.value?.id}`, String(renderedUser.value?.id))
  }

  watch(renderedUser, (newVal) => {
    if (!newVal)
      return
    replaceTitle(`${newVal.username}${message.value.forum.labels.personalHomepage}`)
  }, {
    immediate: true,
  })

  return {
    menuRef,
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
