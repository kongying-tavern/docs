/** Clarity 不可用或调用失败时静默降级，不影响业务。 */

type ClarityMethod = (...args: unknown[]) => unknown

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
    && typeof globalClarity() === 'function'
}

const PENDING_LIMIT = 50
const pending: Array<{ method: string, args: unknown[] }> = []

function callClarity(clarity: ClarityMethod, method: string, args: unknown[]): void {
  try {
    // identify 返回 Promise；同步错误和异步拒绝都不能影响业务。
    void Promise.resolve(clarity(method, ...args)).catch(() => {})
  }
  catch {
    // 诊断服务失败时静默降级，保留原始业务结果。
  }
}

function flushPending(): void {
  if (!clarityAvailable())
    return
  const clarity = globalClarity()
  if (!clarity)
    return
  while (pending.length > 0) {
    const { method, args } = pending.shift()!
    callClarity(clarity, method, args)
  }
}

if (typeof window !== 'undefined')
  window.addEventListener('clarity-ready', flushPending, { once: true })

export function invokeClarity(method: string, ...args: unknown[]): void {
  if (import.meta.env.SSR)
    return

  const clarity = globalClarity()
  if (clarityAvailable() && clarity) {
    callClarity(clarity, method, args)
    return
  }

  if (import.meta.env.DEV)
    return

  // 授权状态先于待发送事件应用；identify 保留顺序以维持事件的会话归属。
  if (method === 'consentv2' || method === 'identify') {
    if (method === 'consentv2') {
      const previous = pending.findIndex(command => command.method === method)
      if (previous !== -1)
        pending.splice(previous, 1)
    }
    if (pending.length >= PENDING_LIMIT) {
      const eventIndex = pending.findIndex(command => command.method === 'event')
      const oldestIdentify = pending.findIndex(command => command.method === 'identify')
      pending.splice(eventIndex !== -1 ? eventIndex : oldestIdentify, 1)
    }
    if (method === 'consentv2')
      pending.unshift({ method, args })
    else
      pending.push({ method, args })
  }
  else if (pending.length < PENDING_LIMIT) {
    pending.push({ method, args })
  }
}

export function grantClarityConsent(): void {
  invokeClarity('consentv2', { ad_Storage: 'granted', analytics_Storage: 'granted' })
}

/** 撤销 cookie 授权；Clarity 仍可能进行有限的无 cookie 统计。 */
export function revokeClarityConsent(): void {
  pending.length = 0
  invokeClarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' })
}

export function identifyClarityUser(userId: string, sessionId: string): void {
  invokeClarity('identify', userId, sessionId)
}

export function sendClarityEvent(name: string): void {
  invokeClarity('event', name)
}
