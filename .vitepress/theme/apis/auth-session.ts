/**
 * API 层读取认证状态的解耦点（注入式访问器）。
 * 由 store 初始化时注册，gitee/interknot client 只依赖本模块取得 token 状态与刷新动作，
 * 避免 client ↔ store 的模块环（token 经回调获取，而非 import 进入 store 子图）。
 */
export interface AuthSessionAccessor {
  isTokenValid: () => boolean
  getAccessToken: () => string | null
  refreshToken: () => Promise<void>
  waitForTokenReady: () => Promise<void>
  isInterKnotTokenValid: () => boolean
  getInterKnotAccessToken: () => string | null
  refreshSSOAuth: () => Promise<void>
}

let accessor: AuthSessionAccessor | null = null

export function registerAuthSessionAccessor(next: AuthSessionAccessor | null): void {
  accessor = next
}

export function getAuthSession(): AuthSessionAccessor | null {
  return accessor
}
