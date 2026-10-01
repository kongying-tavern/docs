import { useLocalStorage } from '@vueuse/core'
import { watch } from 'vue'
import { grantClarityConsent, revokeClarityConsent } from './clarity'
import { identifySession, rotateSupportCode } from './session'

const ENABLED_KEY = 'telemetry:error-reporting:v1'

/** 诊断事件开关,默认开启;关闭会撤销 Clarity cookie 授权并停止本站自定义事件 */
export const reportingEnabled = useLocalStorage<boolean>(ENABLED_KEY, true)

watch(reportingEnabled, (enabled) => {
  if (enabled) {
    grantClarityConsent()
    identifySession()
  }
  else {
    revokeClarityConsent()
  }
}, { flush: 'sync' })

export function enableReporting(): void {
  if (reportingEnabled.value)
    return
  rotateSupportCode()
  reportingEnabled.value = true
}

export function disableReporting(): void {
  reportingEnabled.value = false
}

/** 启动时同步持久关闭状态。 */
export function applyBootReportingState(): void {
  if (!reportingEnabled.value)
    revokeClarityConsent()
}

export function identifySessionIfEnabled(): void {
  if (reportingEnabled.value)
    identifySession()
}
