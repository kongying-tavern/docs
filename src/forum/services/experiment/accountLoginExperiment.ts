import { selectGrayscaleBucket, selectGrayscaleOverride } from './grayscale'

/** 管理员默认在灰度内，其他账号按百分比分层；未识别的账号一律不可用 */
export function selectAccountLoginRollout(accountId: string | number | undefined, percentage: number, canManage: boolean): boolean {
  if (canManage)
    return accountId !== undefined
  return selectGrayscaleBucket('account-login-v1', accountId, percentage)
}

export function resolveAccountLoginRollout(accountId: string | number | undefined, percentage: number, canManage: boolean, override?: boolean): boolean {
  const forced = selectGrayscaleOverride(accountId, canManage, override)
  if (forced !== undefined)
    return forced
  return selectAccountLoginRollout(accountId, percentage, canManage)
}
