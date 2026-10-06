import type ForumAPI from '~/forum/api/types'
import { useMutation, useQueryCache } from '@pinia/colada'
import { useLocalized } from '@/hooks/useLocalized'
import { updateAuthorizedUser } from '~/forum/api/gitee/user'
import { forumKeys } from '~/forum/services/forumQueryContracts'
import { applyUserProfilePatch, settleUserProfilePatch } from '~/forum/services/forumUserProfileOptimistic'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'

/** 设置页和详情页共用保存入口，同步会话信息及用户详情缓存。 */
export function useUserProfileEditor() {
  const auth = useUserAuthStore()
  const userInfo = useUserInfoStore()
  const cache = useQueryCache()
  const { message } = useLocalized()
  const mutation = useMutation({
    mutation: async (profile: ForumAPI.UserProfileUpdate) => {
      const login = userInfo.info?.login
      if (!auth.isLoggedIn || !login)
        throw new Error(message.value.forum.auth.loginMsg)
      const snapshot = userInfo.info!
      const optimistic = applyUserProfilePatch(snapshot, profile)
      const key = forumKeys.user(login)
      cache.cancelQueries({ key, exact: true })
      userInfo.info = optimistic
      cache.setQueryData(key, optimistic)
      try {
        const updated = await updateAuthorizedUser(profile)
        // 请求期间退出或切换账号后，不把旧账号响应写回当前会话。
        if (!auth.isLoggedIn || userInfo.info?.login !== login || updated.login !== login)
          throw new Error(message.value.settings.profile.sessionChanged)
        const settled = settleUserProfilePatch(userInfo.info!, optimistic, updated, profile)
        userInfo.info = settled
        cache.setQueryData(key, settled)
        return updated
      }
      catch (error) {
        if (auth.isLoggedIn && userInfo.info?.login === login) {
          const restored = settleUserProfilePatch(userInfo.info, optimistic, snapshot, profile)
          userInfo.info = restored
          cache.setQueryData(key, restored)
        }
        throw error
      }
    },
  })
  return { save: mutation.mutateAsync, saving: mutation.isLoading }
}
