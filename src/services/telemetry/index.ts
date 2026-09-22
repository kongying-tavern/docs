import type { App } from 'vue'
import { installGlobalErrorCapture } from './capture'
import { applyBootReportingState, identifySessionIfEnabled } from './settings'

let installed = false

export function installTelemetry(app?: App): void {
  if (import.meta.env.SSR || installed)
    return
  installed = true

  installGlobalErrorCapture(app)
  applyBootReportingState()
  identifySessionIfEnabled()
}

export { reportError } from './capture'
export type { ReportResult, Scene } from './capture'
export { clarityAvailable } from './clarity'
export { OpsEvents, trackOp } from './ops'
export type { OpsEvent } from './ops'
export { reportRequestFailure } from './request'
export { ensureSession } from './session'
export { disableReporting, enableReporting, identifySessionIfEnabled, reportingEnabled } from './settings'
export { toast } from './toast'
export type { TelemetryToastOptions } from './toast'
