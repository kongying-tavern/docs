import type { ReportResult } from './capture.ts'
import { reportError } from './capture.ts'

export function reportRequestFailure(error: unknown): ReportResult | null {
  return reportError({ scene: 'api', error })
}
