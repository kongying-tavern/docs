import type { Ref } from 'vue'
import type { CustomConfig } from '~/types/locales'
import { GiteeAPIError } from '~/services/forum/gitee'
import { toast } from '~/services/telemetry/toast'

/**
 * 数据加载失败的统一出口，带限流/未登录特化（附加登录引导动作）。
 *
 * 错误提示通道选型：
 * - 数据加载（读）：能内联呈现的走组件内错误态（列表 error prop、评论区 loadError 文案）；
 *   无内联位或需要登录引导的走本函数。scene 固定为 'ld'。
 * - 写操作（发布/编辑/删除/上传）：直接 `toast.error(..., { error, scene })`，
 *   scene 按操作域选标签（op/tp/cm/up/rc/cd）。
 * - 常驻告警（页面级、需停留展示的）：`showPageAlert`（telemetry/pageAlert）。
 */
export function handleError(
  error: Error | undefined,
  message: Ref<CustomConfig>,
  options?: {
    errorMessage: string
  },
) {
  if (error instanceof GiteeAPIError) {
    if (error.isExceededRateLimit()) {
      return toast.error(message.value.forum.loadError, {
        error,
        scene: 'ld',
        description: message.value.forum.exceededRateLimitWarning,
        action: {
          label: message.value.forum.auth.login,
          onClick: () => (location.hash = 'login-alert'),
        },
      })
    }

    if (error.isUnauthorized()) {
      return toast.error(message.value.forum.loadError, {
        error,
        scene: 'ld',
        description: `${message.value.forum.auth.loginTips} (${error.message})`,
        action: {
          label: message.value.forum.auth.login,
          onClick: () => (location.hash = 'login-alert'),
        },
      })
    }
  }

  return toast.error(options?.errorMessage || message.value.forum.loadError, { error, scene: 'ld' })
}
