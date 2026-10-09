import { selectGrayscaleBucket, selectGrayscaleOverride } from '../experiment/grayscale'

export type FeedbackFormVariant = 'legacy' | 'compact'

export function resolveFeedbackFormVariant(accountId: string | number | undefined, percentage: number, canManage: boolean, override?: boolean): FeedbackFormVariant {
  const forced = selectGrayscaleOverride(accountId, canManage, override)
  if (forced !== undefined)
    return forced ? 'compact' : 'legacy'
  return selectFeedbackFormVariant(accountId, percentage)
}

export function selectFeedbackFormVariant(accountId: string | number | undefined, percentage: number): FeedbackFormVariant {
  return selectGrayscaleBucket('feedback-form-v1', accountId, percentage) ? 'compact' : 'legacy'
}
