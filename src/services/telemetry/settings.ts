import { useLocalStorage } from '@vueuse/core'
import { grantClarityConsent, identifyClarityUser, revokeClarityConsent } from './clarity'
import { getInstallId, identifySession, rotateSupportCode } from './session'

const ENABLED_KEY = 'telemetry:error-reporting:v1'

/** 诊断事件开关,默认开启;关闭会撤销 Clarity cookie 授权并停止本站自定义事件 */
export const reportingEnabled = useLocalStorage<boolean>(ENABLED_KEY, true)

export function enableReporting(): void {
  reportingEnabled.value = true
  grantClarityConsent()
  const code = rotateSupportCode()
  identifyClarityUser(getInstallId(), code)
}

export function disableReporting(): void {
  reportingEnabled.value = false
  revokeClarityConsent()
}

/** 启动引导:持久状态为关闭时,每次进入站点都补一次撤销(覆盖上次会话未生效的窗口) */
export function applyBootReportingState(): void {
  if (!reportingEnabled.value)
    revokeClarityConsent()
}

export function identifySessionIfEnabled(): void {
  if (reportingEnabled.value)
    identifySession()
}
