import type { Component } from 'vue'
import type { ReportResult, Scene } from './capture'
import { isVNode, markRaw } from 'vue'
import { toast as sonner } from 'vue-sonner'
import TelemetryToastDescription from '~/components/telemetry/TelemetryToastDescription.vue'
import { reportError } from './capture'
import { describeError, formatTraceId } from './describeError'

type SonnerMessage = Parameters<typeof sonner.error>[0]
type SonnerOptions = Parameters<typeof sonner.error>[1]

type ToastOptionsBase = Omit<Exclude<SonnerOptions, undefined>, 'componentProps'> & {
  componentProps?: Record<string, unknown>
}

export type TelemetryToastOptions = ToastOptionsBase & {
  /** 触发上报的错误对象;缺省时 toast.error 仍会上报一条无详情事件 */
  error?: unknown
  /** 错误场景前缀,缺省时按是否携带 error 取 api / ui */
  scene?: Scene
  /** 手动控制本次是否上报(默认:error 自动上报;info/warning 需携带 error 或显式开启) */
  report?: boolean
}

type ReportableMethod = 'error' | 'info' | 'warning'

function shouldReport(method: ReportableMethod, options?: TelemetryToastOptions): boolean {
  if (options?.report !== undefined)
    return options.report
  if (method === 'error')
    return true
  return options?.error !== undefined || options?.componentProps?.error !== undefined
}

function extractError(options?: TelemetryToastOptions): unknown {
  return options?.error ?? options?.componentProps?.error
}

function isWrappableDescription(description: unknown): description is string | Component {
  return description === undefined || description === null || typeof description === 'string'
    || typeof description === 'function'
    || (typeof description === 'object' && !isVNode(description))
}

function withMeta(
  options: TelemetryToastOptions | undefined,
  meta: ReportResult | null,
  error: unknown,
  title: SonnerMessage,
): TelemetryToastOptions {
  if (!isWrappableDescription(options?.description))
    return options ?? {}

  // 关闭上报时没有追踪标识,但仍应把具体报错信息呈现给用户
  const detail = describeError(error)
  const traceId = formatTraceId(meta)
  if (!detail && !traceId)
    return options ?? {}

  return {
    ...options,
    description: markRaw(TelemetryToastDescription),
    componentProps: {
      title: typeof title === 'string' ? title : null,
      content: options?.description ?? null,
      contentProps: options?.componentProps,
      detail,
      traceId,
    },
  }
}

function emit(
  method: ReportableMethod,
  message: SonnerMessage,
  options?: TelemetryToastOptions,
): string | number {
  const error = extractError(options)
  const reported = shouldReport(method, options)
    ? reportError({ scene: options?.scene ?? (error !== undefined ? 'api' : 'ui'), error })
    : null
  return sonner[method](message, withMeta(options, reported, error, message))
}

export const toast = {
  ...sonner,
  error: (message: SonnerMessage, options?: TelemetryToastOptions) => emit('error', message, options),
  info: (message: SonnerMessage, options?: TelemetryToastOptions) => emit('info', message, options),
  warning: (message: SonnerMessage, options?: TelemetryToastOptions) => emit('warning', message, options),
}
