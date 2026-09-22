/**
 * Microsoft Clarity 客户端命令的安全调用封装。
 *
 * 只使用官方文档化命令(consentv2 / identify / event);所有命令在
 * SSR、未加载脚本(开发环境)时静默降级,不抛错、不阻塞业务。
 */

type ClarityMethod = (...args: unknown[]) => void

interface ClarityGlobal {
  clarity?: ClarityMethod
}

function globalClarity(): ClarityMethod | undefined {
  if (typeof window === 'undefined')
    return undefined
  return (window as unknown as ClarityGlobal).clarity
}

export function clarityAvailable(): boolean {
  return typeof document !== 'undefined'
    && document.documentElement.dataset.clarityLoaded === 'true'
    && globalClarity() !== undefined
}

const PENDING_LIMIT = 50
const pending: Array<{ method: string, args: unknown[] }> = []

function flushPending(): void {
  if (!clarityAvailable())
    return
  const clarity = globalClarity()
  if (!clarity)
    return
  while (pending.length > 0) {
    const { method, args } = pending.shift()!
    clarity(method, ...args)
  }
}

if (typeof window !== 'undefined')
  window.addEventListener('clarity-ready', flushPending, { once: true })

export function invokeClarity(method: string, ...args: unknown[]): void {
  if (import.meta.env.SSR)
    return

  const clarity = globalClarity()
  if (clarityAvailable() && clarity) {
    clarity(method, ...args)
    return
  }

  if (import.meta.env.DEV)
    return

  if (pending.length < PENDING_LIMIT)
    pending.push({ method, args })
}

/** 授权：恢复完整采集。consentv2 键名按官方文档原样书写 */
export function grantClarityConsent(): void {
  invokeClarity('consentv2', { ad_Storage: 'granted', analytics_Storage: 'granted' })
}

/** 撤销 cookie 授权并停止本站自定义诊断事件;Clarity 仍可能进行有限的无 cookie 统计 */
export function revokeClarityConsent(): void {
  pending.length = 0
  invokeClarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' })
}

/** 自定义标识:custom-id 由 Clarity 端哈希存储,custom-session-id 用于后台筛选定位会话 */
export function identifyClarityUser(userId: string, sessionId: string): void {
  invokeClarity('identify', userId, sessionId)
}

export function sendClarityEvent(name: string): void {
  invokeClarity('event', name)
}
