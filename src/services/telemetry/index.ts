import type { App } from 'vue'
import { installGlobalErrorCapture } from './capture.ts'
import { applyBootReportingState, identifySessionIfEnabled } from './settings.ts'

let installed = false

export function installTelemetry(app?: App): void {
  if (import.meta.env.SSR || installed)
    return
  installed = true

  installGlobalErrorCapture(app)
  applyBootReportingState()
  identifySessionIfEnabled()
}

export { reportError } from './capture.ts'
export type { ReportResult, Scene } from './capture.ts'
export { clarityAvailable } from './clarity.ts'
export { OpsEvents, trackOp } from './ops.ts'
export type { OpsEvent } from './ops.ts'
export { reportRequestFailure } from './request.ts'
export { ensureSession } from './session.ts'
export { disableReporting, enableReporting, identifySessionIfEnabled, reportingEnabled } from './settings.ts'
export { toast } from './toast.ts'
export type { TelemetryToastOptions } from './toast.ts'
