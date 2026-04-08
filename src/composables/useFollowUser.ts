import { useMutation, useQuery } from '@pinia/colada'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { user } from '@/apis/forum/gitee'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { authGuards } from '@/utils/auth-helpers'

export function useFollowUser(targetUser: string, authorizedUser?: string) {
  const followState = ref<boolean | null>(null)

  const userInfo = useUserInfoStore()

  const currentUser = computed(() => authorizedUser || userInfo?.info?.login)

  const disabled = ref(currentUser.value === targetUser)

  if (!targetUser) {
    throw new Error('目标用户不能为空')
  }

  // 获取关注状态 - useQuery
  const {
    data: alreadyFollowed,
    error: getFollowStatusError,
  } = useQuery({
    key: () => ['follow-status', currentUser.value ?? '', targetUser] as const,
    query: () => user.getFollowStatus(currentUser.value!, targetUser),
    enabled: () => !disabled.value && !!currentUser.value,
    staleTime: 1000 * 60 * 5, // 5分钟内不重新请求
  })

  // 切换关注 - useMutation
  const {
    mutate: runToggleFollow,
    isLoading: following,
    error: followError,
  } = useMutation({
    mutation: (params: { follow: boolean, targetUser: string }) =>
      user.toggleFollowUser(params.follow, params.targetUser),
    onMutate: () => {
      if (!authGuards.requireLogin()) {
        throw new Error('需要登录')
      }
      if (currentUser.value === targetUser) {
        toast.warning('不能对自己进行该操作')
        throw new Error('不能对自己进行该操作')
      }
    },
    onError: (error) => {
      console.error('关注用户操作失败:', error)
      toast.error('关注失败，请稍后重试')
    },
  })

  const cancelFollowThisUser = async () => {
    const result = await runToggleFollow({ follow: false, targetUser })
    toast.success('取关成功')
    followState.value = false
    return result
  }

  const followThisUser = async () => {
    const result = await runToggleFollow({ follow: true, targetUser })
    toast.success('关注成功')
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

  watch(followError, (error) => {
    if (error) {
      console.error('关注用户时发生错误:', error)
      toast.error('关注失败，请稍后重试')
    }
  })

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
