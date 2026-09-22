import type { ReportResult } from './capture'
import { reportError } from './capture'

export function reportRequestFailure(error: unknown): ReportResult | null {
  return reportError({ scene: 'api', error })
}
