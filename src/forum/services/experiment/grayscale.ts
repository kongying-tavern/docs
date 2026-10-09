/**
 * 灰度分层：seed 与账号共同决定分组，放量时已入选的账号保持入选。
 * 同一 seed 在不同功能间复用会让分组完全相关，新功能要使用自己的 seed。
 */
export function selectGrayscaleBucket(seed: string, accountId: string | number | undefined, percentage: number): boolean {
  if (accountId === undefined || !Number.isFinite(percentage) || percentage <= 0)
    return false
  let hash = 2166136261
  for (const character of `${seed}:${accountId}`) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % 10000 < Math.min(percentage, 100) * 100
}

/** 人工覆盖只对已识别的管理员生效，其余账号一律按分层结果走 */
export function selectGrayscaleOverride(accountId: string | number | undefined, canManage: boolean, override?: boolean): boolean | undefined {
  return accountId !== undefined && canManage && typeof override === 'boolean' ? override : undefined
}
