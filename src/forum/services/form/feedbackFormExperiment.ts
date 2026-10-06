export type FeedbackFormVariant = 'legacy' | 'compact'

export function resolveFeedbackFormVariant(accountId: string | number | undefined, percentage: number, canManage: boolean, override?: boolean): FeedbackFormVariant {
  if (accountId !== undefined && canManage && typeof override === 'boolean')
    return override ? 'compact' : 'legacy'
  return selectFeedbackFormVariant(accountId, percentage)
}

// Keep the seed stable when increasing traffic so existing participants stay assigned.
export function selectFeedbackFormVariant(accountId: string | number | undefined, percentage: number): FeedbackFormVariant {
  if (accountId === undefined || !Number.isFinite(percentage) || percentage <= 0)
    return 'legacy'
  let hash = 2166136261
  for (const character of `feedback-form-v1:${accountId}`) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % 10000 < Math.min(percentage, 100) * 100 ? 'compact' : 'legacy'
}
