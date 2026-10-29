import { useMutation, useQuery } from '@pinia/colada'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { user } from '~/forum/api/gitee'
import { authGuards } from '~/forum/composables/auth/auth-helpers'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'
import { toast } from '~/services/telemetry/toast'

export function useFollowUser(targetUser: string, authorizedUser?: string) {
  const followState = ref<boolean | null>(null)

  const { t } = useI18n({ useScope: 'global' })
  const userInfo = useUserInfoStore()

  const currentUser = computed(() => authorizedUser || userInfo?.info?.login)

  const disabled = ref(currentUser.value === targetUser)

  if (!targetUser) {
    throw new Error('useFollowUser: targetUser is required')
  }

  const {
    data: alreadyFollowed,
    error: getFollowStatusError,
  } = useQuery({
    key: () => ['follow-status', currentUser.value ?? '', targetUser] as const,
    query: () => user.getFollowStatus(currentUser.value!, targetUser),
    enabled: () => !disabled.value && !!currentUser.value,
    staleTime: 1000 * 60 * 5,
  })

  const {
    mutate: runToggleFollow,
    isLoading: following,
    error: followError,
  } = useMutation({
    mutation: (params: { follow: boolean, targetUser: string }) =>
      user.toggleFollowUser(params.follow, params.targetUser),
    onMutate: () => {
      if (!authGuards.requireLogin()) {
        throw new Error(t('forum.auth.loginTips'))
      }
      if (currentUser.value === targetUser) {
        toast.warning(t('forum.errors.cannotDoToSelf'))
        throw new Error(t('forum.errors.cannotDoToSelf'))
      }
    },
    onError: (error) => {
      toast.error(t('forum.errors.followFailed'), { error })
    },
  })

  const cancelFollowThisUser = async () => {
    const result = await runToggleFollow({ follow: false, targetUser })
    followState.value = false
    return result
  }

  const followThisUser = async () => {
    const result = await runToggleFollow({ follow: true, targetUser })
    followState.value = true
    return result
  }

  const toggleFollowThisUser = async () => {
    if (followState.value === null)
      return
    if (followState.value)
      return await cancelFollowThisUser()
    await followThisUser()
  }

  watch(alreadyFollowed, (val) => {
    if (val !== undefined) {
      followState.value = val
    }
  }, { immediate: true })

  return {
    followState,
    followThisUser,
    following,
    followError,
    getFollowStatusError,
    cancelFollowThisUser,
    toggleFollowThisUser,
    disabled,
  }
}
