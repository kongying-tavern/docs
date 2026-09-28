const LOGIN_INTENT_KEY = 'login-intent'

/** 登录发起时记录的意图 hash（如 PUBLISH-TOPIC），登录成功后由 useLogin 回放 */
export function rememberLoginIntent(hash: string): void {
  sessionStorage.setItem(LOGIN_INTENT_KEY, hash)
}

/** 一次性消费：读取即清除 */
export function takeLoginIntent(): string | null {
  const intent = sessionStorage.getItem(LOGIN_INTENT_KEY)
  if (intent !== null)
    sessionStorage.removeItem(LOGIN_INTENT_KEY)
  return intent
}

export function clearLoginIntent(): void {
  sessionStorage.removeItem(LOGIN_INTENT_KEY)
}
