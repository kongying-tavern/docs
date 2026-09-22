import { sendClarityEvent } from './clarity'
import { telemetryLog, TelemetryLogGroup } from './logger'
import { ensureSession } from './session'
import { reportingEnabled } from './settings'

/** 操作打点事件白名单:失败路径统一走 reportError,这里只记录成功/里程碑类操作 */
export const OpsEvents = {
  topicPublish: 'forum_topic_publish',
  commentSubmit: 'forum_comment_submit',
  reactionToggle: 'forum_reaction_toggle',
  loginSuccess: 'auth_login_success',
  logout: 'auth_logout',
} as const

export type OpsEvent = (typeof OpsEvents)[keyof typeof OpsEvents]

export function trackOp(event: OpsEvent): void {
  if (import.meta.env.SSR || !reportingEnabled.value)
    return

  ensureSession()
  sendClarityEvent(event)
  if (import.meta.env.DEV)
    telemetryLog.info(TelemetryLogGroup.OPERATION, event)
}
