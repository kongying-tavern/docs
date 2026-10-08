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
  'oa',
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

/** 同一会话内复用错误及其 cause/originalError 链的追踪标识。 */
const reportedErrors = new WeakMap<object, ReportResult>()

function report(errorId: string, code: string): ReportResult {
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
  if (typeof window === 'undefined' || import.meta.env.SSR || !reportingEnabled.value)
    return null

  const { error } = options ?? {}
  const { code } = ensureSession()
  const references = new Set<object>()
  let current = error
  while (current !== null && (typeof current === 'object' || typeof current === 'function') && !references.has(current)) {
    references.add(current)
    const cached = reportedErrors.get(current)
    if (cached?.sessionId === code) {
      for (const reference of references)
        reportedErrors.set(reference, cached)
      return cached
    }
    try {
      const wrapped = current as { cause?: unknown, originalError?: unknown }
      current = wrapped.cause ?? wrapped.originalError
    }
    catch {
      break
    }
  }
  const scene = options?.scene ?? (error !== undefined ? 'api' : 'ui')
  const result = report(`${scene}-${randomId(8)}`, code)
  for (const reference of references)
    reportedErrors.set(reference, result)
  return result
}

/**
 * 全局未捕获异常自动上报(无 UI 展示),同一错误只处理一次并做节流,
 * 保留原有 console 输出不改变开发者可见行为。
 */
export function installGlobalErrorCapture(app?: App): void {
  if (import.meta.env.SSR)
    return

  let lastCaptureAt = 0

  function capture(error: unknown): void {
    if (!reportingEnabled.value)
      return

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
    const previousHandler = app.config.errorHandler
    app.config.errorHandler = (error, _instance, info) => {
      capture(error)
      if (previousHandler)
        previousHandler(error, _instance, info)
      else
        telemetryLog.error(TelemetryLogGroup.VUE, info ?? 'unknown', error)
    }
  }
}
