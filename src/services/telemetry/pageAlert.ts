import type { Scene } from './capture'
import type { PageAlertVariant } from '@/stores/usePageAlert'
import { usePageAlertStore } from '@/stores/usePageAlert'
import { formatMessage } from '~/components/forum/utils/forumUi'
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
}

const DEFAULT_ALERT_ID = 'page-alert'
const TRACE_ID_PLACEHOLDER = '{traceId}'

function resolveDescription(template: string | undefined, traceId: string | null): string | undefined {
  if (!template)
    return undefined
  // 关闭上报时拿不到标识，纯为展示标识而写的文案就不再出现
  if (!traceId)
    return template.includes(TRACE_ID_PLACEHOLDER) ? undefined : template
  return formatMessage(template, { traceId })
}

/** 页面顶部展示常驻告警；当前页面未挂载告警区域时回退为 toast */
export function showPageAlert(message: string, options: PageAlertOptions = {}): void {
  const pageAlert = usePageAlertStore()
  const scene = options.scene ?? (options.error !== undefined ? 'api' : 'ui')

  if (!pageAlert.hasRegion) {
    // 这里自己上报一次以取得追踪标识；toast 侧用 report: false 避免重复上报
    const reported = reportError({ scene, error: options.error })
    toast.error(message, {
      id: options.id ?? DEFAULT_ALERT_ID,
      scene: options.scene,
      error: options.error,
      description: resolveDescription(options.description, formatTraceId(reported)),
      report: false,
    })
    return
  }

  const reported = reportError({ scene, error: options.error })
  pageAlert.push({
    id: options.id ?? DEFAULT_ALERT_ID,
    variant: options.variant ?? 'destructive',
    title: message,
    description: resolveDescription(options.description, formatTraceId(reported)),
  })
}
