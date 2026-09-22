/** 异常文本可能极长(如整段响应体),截断后仍保留可辨识的开头 */
const MAX_DETAIL_LENGTH = 300

export interface TraceMeta {
  errorId?: string | null
  sessionId?: string | null
}

interface ErrorLike {
  name?: unknown
  message?: unknown
  state?: unknown
  endpoint?: unknown
  method?: unknown
}

function truncate(text: string): string {
  return text.length > MAX_DETAIL_LENGTH ? `${text.slice(0, MAX_DETAIL_LENGTH)}…` : text
}

/**
 * 把任意错误整理成一行可读详情,供 toast 展示与复制。
 * 只有错误ID没有详情时用户无从判断故障原因,所以优先取 name/message,
 * 接口类错误再补上状态码与请求地址;拿不到结构化字段时退化为 JSON 文本。
 */
export function describeError(error: unknown): string | null {
  if (error === undefined || error === null)
    return null

  if (typeof error === 'string') {
    const text = error.trim()
    return text ? truncate(text) : null
  }

  if (typeof error === 'object') {
    const { name, message, state, endpoint, method } = error as ErrorLike
    const label = typeof name === 'string' && name && name !== 'Error' ? name : ''
    const text = typeof message === 'string' ? message.trim() : ''
    const parts: string[] = []
    if (text)
      parts.push(label ? `${label}: ${text}` : text)
    else if (label)
      parts.push(label)
    if (typeof state === 'number')
      parts.push(`HTTP ${state}`)
    if (typeof endpoint === 'string' && endpoint)
      parts.push(`${typeof method === 'string' && method ? `${method} ` : ''}${endpoint}`)
    if (parts.length > 0)
      return truncate(parts.join(' · '))

    try {
      const json = JSON.stringify(error)
      if (json && json !== '{}')
        return truncate(json)
    }
    catch {
      // 循环引用等无法序列化的对象继续退化
    }
    return null
  }

  return truncate(String(error))
}

/** 会话ID在前、错误ID在后,便于支持人员按会话检索对应日志 */
export function formatTraceId(meta: TraceMeta | null | undefined): string | null {
  const sessionId = meta?.sessionId?.trim()
  const errorId = meta?.errorId?.trim()
  if (sessionId && errorId)
    return `${sessionId}-${errorId}`
  return sessionId || errorId || null
}
