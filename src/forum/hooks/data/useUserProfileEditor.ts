import type ForumAPI from '@/src/forum/api/types.d.ts'
import { useMutation, useQueryCache } from '@pinia/colada'
import { useI18n } from 'vue-i18n'
import { updateAuthorizedUser } from '@/src/forum/api/gitee/user.ts'
import { forumKeys } from '@/src/forum/services/forumQueryContracts.ts'
import { applyUserProfilePatch, settleUserProfilePatch } from '@/src/forum/services/forumUserProfileOptimistic.ts'
import { useUserAuthStore } from '@/src/forum/stores/auth/useUserAuth.ts'
import { useUserInfoStore } from '@/src/forum/stores/auth/useUserInfo.ts'

/** 设置页和详情页共用保存入口，同步会话信息及用户详情缓存。 */
export function useUserProfileEditor() {
  const auth = useUserAuthStore()
  const userInfo = useUserInfoStore()
  const cache = useQueryCache()
  const { t } = useI18n({ useScope: 'global' })
  const mutation = useMutation({
    mutation: async (profile: ForumAPI.UserProfileUpdate) => {
      const login = userInfo.info?.login
      if (!auth.isLoggedIn || !login)
        throw new Error(t('forum.auth.loginMsg'))
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
          throw new Error(t('settings.profile.sessionChanged'))
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
