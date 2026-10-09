import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'

/** 灰度覆盖按账号存在浏览器里，只有登录中的管理员可读可写 */
export function useGrayscaleOverride(storageKey: string) {
  const overrides = useLocalStorage<Record<string, boolean>>(storageKey, {})
  const userInfo = useUserInfoStore()
  const auth = useUserAuthStore()
  const { hasAnyPermissions } = useRuleChecks()
  const permission = hasAnyPermissions('manage_feedback')
  const canManage = computed(() => auth.isLoggedIn && permission.value)
  const accountId = computed(() => userInfo.info?.id)
  const override = computed(() => accountId.value === undefined ? undefined : overrides.value?.[String(accountId.value)])

  function setOverride(value: boolean | undefined): void {
    if (!canManage.value || accountId.value === undefined)
      return

    const key = String(accountId.value)
    const next = { ...overrides.value }
    if (value === undefined)
      delete next[key]
    else
      next[key] = value
    overrides.value = next
  }

  return { canManage, accountId, override, setOverride }
}
