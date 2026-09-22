import type { App } from 'vue'
import { sendClarityEvent } from './clarity'
import { telemetryLog, TelemetryLogGroup } from './logger'
import { ensureSession } from './session'
import { reportingEnabled } from './settings'
import { randomId } from './util'

/**
 * 错误场景前缀,随错误ID一起呈现(如 tp-x7k2m9a1),
 * 也便于在 Clarity 后台按事件名区分错误来源。
 */
export const SCENES = [
  'tp', // 发布主题
  'up', // 图片上传
  'cm', // 发布评论
  'cd', // 删除评论
  'op', // 话题管理操作(置顶/关闭/隐藏等)
  'rc', // 表态
  'ld', // 列表/话题加载
  'lg', // 密码登录
  'oa', // OAuth 登录/回调
  'ss', // SSO 会话刷新
  'api', // 通用接口失败
  'ui', // 界面提示类(无错误对象)
  'ux', // 全局未捕获异常
] as const

export type Scene = (typeof SCENES)[number]

export interface ReportResult {
  /** 供用户复制的错误ID(场景前缀 + 随机串) */
  errorId: string
  /** 上报时刻的会话标识 */
  sessionId: string
}

/** 同一 Error 对象只上报一次,toast 层与请求层重复相遇时复用同一错误ID */
const reportedErrors = new WeakMap<object, ReportResult>()

function report(errorId: string): ReportResult {
  const { code } = ensureSession()
  const result: ReportResult = { errorId, sessionId: code }
  sendClarityEvent(`error_${errorId}`)
  if (import.meta.env.DEV)
    telemetryLog.info(TelemetryLogGroup.ERROR, `error_${errorId}`)
  return result
}

/**
 * 上报一次错误。返回错误ID与会话标识用于展示;
 * 上报关闭或 SSR 时返回 null,调用方应据此隐藏相关 UI。
 */
export function reportError(options?: { scene?: Scene, error?: unknown }): ReportResult | null {
  if (import.meta.env.SSR || !reportingEnabled.value)
    return null

  const { error } = options ?? {}
  if (error !== null && (typeof error === 'object' || typeof error === 'function')) {
    const cached = reportedErrors.get(error as object)
    if (cached)
      return cached
  }

  const scene = options?.scene ?? (error !== undefined ? 'api' : 'ui')
  const errorId = `${scene}-${randomId(8)}`
  const result = report(errorId)

  if (error !== null && (typeof error === 'object' || typeof error === 'function'))
    reportedErrors.set(error as object, result)
  return result
}

/**
 * 全局未捕获异常自动上报(无 UI 展示),同一错误只处理一次并做节流,
 * 保留原有 console 输出不改变开发者可见行为。
 */
export function installGlobalErrorCapture(app?: App): void {
  if (import.meta.env.SSR)
    return

  const seen = new WeakSet<object>()
  let lastCaptureAt = 0

  function capture(error: unknown): void {
    const isReference = error !== null && (typeof error === 'object' || typeof error === 'function')
    if (isReference) {
      if (seen.has(error as object))
        return
      seen.add(error as object)
    }

    // 突发异常风暴时每秒至多自动上报一条
    const now = Date.now()
    if (now - lastCaptureAt < 1000)
      return
    lastCaptureAt = now

    reportError({ scene: 'ux', error })
  }

  window.addEventListener('error', (event) => {
    capture(event.error ?? event.message)
  })
  window.addEventListener('unhandledrejection', (event) => {
    capture(event.reason)
  })

  if (app) {
    app.config.errorHandler = (error, _instance, info) => {
      capture(error)
      telemetryLog.error(TelemetryLogGroup.VUE, info ?? 'unknown', error)
    }
  }
}
