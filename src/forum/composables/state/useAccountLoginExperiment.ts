import { useLocalStorage } from '@vueuse/core'
import { computed, watch } from 'vue'
import { useGrayscaleOverride } from '~/forum/composables/state/useGrayscaleOverride'
import { resolveAccountLoginRollout, selectAccountLoginRollout } from '~/forum/services/experiment/accountLoginExperiment'

/**
 * 密码登录弹窗只在使用者登出时打开，此刻已拿不到账号身份，
 * 因此浏览器记住最近一次已知账号的灰度结果，登出后据此放行哈希入口。
 */
const BROWSER_ACCESS_KEY = 'forum-account-login-access'

export function useAccountLoginExperiment() {
  const access = useLocalStorage(BROWSER_ACCESS_KEY, false)
  const browserAccess = () => !import.meta.env.SSR && access.value
  const { canManage, accountId, override, setOverride } = useGrayscaleOverride('forum-account-login-overrides')
  const percentage = Number(import.meta.env.VITE_ACCOUNT_LOGIN_PERCENT ?? 0)
  const assigned = computed(() => selectAccountLoginRollout(accountId.value, percentage, canManage.value))
  const enabled = computed({
    get: () => resolveAccountLoginRollout(accountId.value, percentage, canManage.value, override.value),
    set: (value: boolean) => setOverride(value === assigned.value ? undefined : value),
  })

  watch([accountId, enabled], () => {
    if (!import.meta.env.SSR && accountId.value !== undefined)
      access.value = enabled.value
  }, { immediate: true })

  return { canManage, enabled, browserAccess }
}
