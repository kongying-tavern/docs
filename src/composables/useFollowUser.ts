import { user } from '@/apis/forum/gitee'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { computed, ref, watch } from 'vue'
import { useRequest } from 'vue-request'
import { toast } from 'vue-sonner'

export function useFollowUser(targetUser: string, authorizedUser?: string) {
  const followState = ref<boolean | null>(null)

  const userAuth = useUserAuthStore()
  const userInfo = useUserInfoStore()

  const currentUser = computed(() => authorizedUser || userInfo?.info?.login)

  const disabled = ref(currentUser.value === targetUser)

  if (!targetUser) {
    throw new Error('目标用户不能为空')
  }

  const { data: alreadyFollowed, error: getFollowStatusError, run: getFollowStatus } = useRequest(
    user.getFollowStatus,
    {
      manual: true,
      onError: (error) => {
        console.error('获取关注状态失败:', error)
      },
    },
  )

  // 只在已登录状态下获取关注状态
  if (!disabled.value && currentUser.value) {
    getFollowStatus(currentUser.value, targetUser)
  }

  const {
    runAsync,
    loading: following,
    error: followError,
  } = useRequest(user.toggleFollowUser, {
    manual: true,
    defaultParams: [true, targetUser],
    onBefore: () => {
      if (!userAuth.isTokenValid) {
        location.hash = 'login-alert'
        return false
      }

      if (currentUser.value === targetUser) {
        toast.warning('不能对自己进行该操作')
        return false
      }
    },
    onError: (error) => {
      console.error('关注用户操作失败:', error)
      toast.error('关注失败，请稍后重试')
    },
  })

  const cancelFollowThisUser = async () => {
    const result = await runAsync(false, targetUser)
    toast.success('取关成功')
    followState.value = false
    return result
  }

  const followThisUser = async () => {
    const result = await runAsync(true, targetUser)
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

  watch(currentUser, () => {
    if (!disabled.value && currentUser.value && !alreadyFollowed) {
      getFollowStatus(currentUser.value, targetUser)
    }
  })

  watch(followError, (error) => {
    console.error('关注用户时发生错误:', error)
    toast.error('关注失败，请稍后重试')
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
