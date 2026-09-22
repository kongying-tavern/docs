const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** 生成随机短标识(错误ID/会话标识等),SSR 与无 crypto 环境退化为 Math.random */
export function randomId(length: number): string {
  const fallback = () => Math.random().toString(36).slice(2, 2 + length).padEnd(length, '0')
  if (import.meta.env.SSR)
    return fallback()

  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
  if (!cryptoObj?.getRandomValues)
    return fallback()

  const bytes = new Uint8Array(length)
  cryptoObj.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < length; i++)
    out += ALPHABET[bytes[i]! % ALPHABET.length]
  return out
}

export function readStorage<T>(key: string): T | null {
  if (typeof localStorage === 'undefined')
    return null
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? null : JSON.parse(raw) as T
  }
  catch {
    return null
  }
}

export function writeStorage(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined')
    return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  }
  catch {
    // 隐私模式/配额不足时静默降级:标识只影响本次会话内的关联
  }
}
