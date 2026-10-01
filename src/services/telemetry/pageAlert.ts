import type { Scene } from './capture'
import type { PageAlertVariant } from '@/stores/usePageAlert'
import { usePageAlertStore } from '@/stores/usePageAlert'
import { formatMessage } from '~/utils/formatMessage'
import { reportError } from './capture'
import { formatTraceId } from './describeError'
import { toast } from './toast'

export interface PageAlertOptions {
  id?: string
  error?: unknown
  scene?: Scene
  variant?: PageAlertVariant
  /** 可用 {traceId} 占位符，会替换成会话ID与错误ID合并后的追踪标识 */
  description?: string
  /** 无追踪标识时仍需展示的错误正文 */
  descriptionFallback?: string
}

const DEFAULT_ALERT_ID = 'page-alert'
const TRACE_ID_PLACEHOLDER = '{traceId}'

function resolveDescription(template: string | undefined, traceId: string | null, fallback?: string): string | undefined {
  if (!template)
    return undefined
  if (!traceId)
    return template.includes(TRACE_ID_PLACEHOLDER) ? fallback : template
  return formatMessage(template, { traceId })
}

/** 页面顶部展示常驻告警；当前页面未挂载告警区域时回退为 toast */
export function showPageAlert(message: string, options: PageAlertOptions = {}): void {
  const pageAlert = usePageAlertStore()
  const scene = options.scene ?? (options.error !== undefined ? 'api' : 'ui')

  if (!pageAlert.hasRegion) {
    // 已取得追踪标识，toast 不再重复上报。
    const reported = reportError({ scene, error: options.error })
    toast.error(message, {
      id: options.id ?? DEFAULT_ALERT_ID,
      scene: options.scene,
      error: options.error,
      description: resolveDescription(options.description, formatTraceId(reported), options.descriptionFallback),
      report: false,
    })
    return
  }

  const reported = reportError({ scene, error: options.error })
  pageAlert.push({
    id: options.id ?? DEFAULT_ALERT_ID,
    variant: options.variant ?? 'destructive',
    title: message,
    description: resolveDescription(options.description, formatTraceId(reported), options.descriptionFallback),
  })
}
