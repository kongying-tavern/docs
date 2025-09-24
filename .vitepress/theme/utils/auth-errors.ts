/**
 * 认证相关的错误类型和错误处理工具
 */

export enum AuthErrorType {
  // Token相关错误
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  TOKEN_MISSING = 'TOKEN_MISSING',

  // OAuth流程错误
  OAUTH_CODE_MISSING = 'OAUTH_CODE_MISSING',
  OAUTH_EXCHANGE_FAILED = 'OAUTH_EXCHANGE_FAILED',
  OAUTH_REDIRECT_FAILED = 'OAUTH_REDIRECT_FAILED',

  // 网络和API错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',

  // 用户信息相关
  USER_INFO_FETCH_FAILED = 'USER_INFO_FETCH_FAILED',

  // SSO相关
  SSO_REFRESH_FAILED = 'SSO_REFRESH_FAILED',
  SSO_LOGOUT_FAILED = 'SSO_LOGOUT_FAILED',
}

export class AuthError extends Error {
  public readonly type: AuthErrorType
  public readonly originalError?: Error
  public readonly context?: Record<string, unknown>

  constructor(
    type: AuthErrorType,
    message: string,
    originalError?: Error,
    context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'AuthError'
    this.type = type
    this.originalError = originalError
    this.context = context
  }

  /**
   * 检查是否为特定类型的认证错误
   */
  static isAuthError(error: unknown, type?: AuthErrorType): error is AuthError {
    if (!(error instanceof AuthError))
      return false
    return type ? error.type === type : true
  }

  /**
   * 检查是否为可重试的错误
   */
  isRetryable(): boolean {
    return [
      AuthErrorType.NETWORK_ERROR,
      AuthErrorType.TOKEN_REFRESH_FAILED,
      AuthErrorType.SSO_REFRESH_FAILED,
    ].includes(this.type)
  }

  /**
   * 检查是否需要重新登录
   */
  requiresReauth(): boolean {
    return [
      AuthErrorType.TOKEN_EXPIRED,
      AuthErrorType.TOKEN_INVALID,
      AuthErrorType.UNAUTHORIZED,
    ].includes(this.type)
  }

  /**
   * 获取用户友好的错误信息
   */
  getUserMessage(): string {
    switch (this.type) {
      case AuthErrorType.TOKEN_EXPIRED:
        return '登录已过期，请重新登录'
      case AuthErrorType.TOKEN_INVALID:
        return '登录状态异常，请重新登录'
      case AuthErrorType.TOKEN_REFRESH_FAILED:
        return '登录状态更新失败，请稍后重试'
      case AuthErrorType.OAUTH_EXCHANGE_FAILED:
        return '登录过程中出现问题，请重试'
      case AuthErrorType.NETWORK_ERROR:
        return '网络连接异常，请检查网络后重试'
      case AuthErrorType.USER_INFO_FETCH_FAILED:
        return '获取用户信息失败，请稍后重试'
      default:
        return this.message || '操作失败，请稍后重试'
    }
  }

  /**
   * 转换为日志格式
   */
  toLogFormat(): {
    type: AuthErrorType
    message: string
    originalError?: string
    context?: Record<string, unknown>
  } {
    return {
      type: this.type,
      message: this.message,
      originalError: this.originalError?.message,
      context: this.context,
    }
  }
}

/**
 * 创建认证错误的便捷函数
 */
export const createAuthError = {
  tokenExpired: (originalError?: Error) =>
    new AuthError(AuthErrorType.TOKEN_EXPIRED, '访问令牌已过期', originalError),

  tokenInvalid: (originalError?: Error) =>
    new AuthError(AuthErrorType.TOKEN_INVALID, '访问令牌无效', originalError),

  tokenRefreshFailed: (originalError?: Error) =>
    new AuthError(AuthErrorType.TOKEN_REFRESH_FAILED, '刷新令牌失败', originalError),

  tokenMissing: () =>
    new AuthError(AuthErrorType.TOKEN_MISSING, '缺少访问令牌'),

  oauthExchangeFailed: (originalError?: Error) =>
    new AuthError(AuthErrorType.OAUTH_EXCHANGE_FAILED, 'OAuth授权码交换失败', originalError),

  networkError: (originalError?: Error) =>
    new AuthError(AuthErrorType.NETWORK_ERROR, '网络请求失败', originalError),

  unauthorized: (originalError?: Error) =>
    new AuthError(AuthErrorType.UNAUTHORIZED, '未授权访问', originalError),

  userInfoFetchFailed: (originalError?: Error) =>
    new AuthError(AuthErrorType.USER_INFO_FETCH_FAILED, '获取用户信息失败', originalError),

  ssoRefreshFailed: (originalError?: Error, ssoType?: string) =>
    new AuthError(AuthErrorType.SSO_REFRESH_FAILED, `SSO令牌刷新失败${ssoType ? `: ${ssoType}` : ''}`, originalError),
}

/**
 * 统一的错误结果类型
 */
export type AuthResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: AuthError
}

/**
 * 将API调用包装为统一的错误处理格式
 */
export async function wrapAuthOperation<T>(
  operation: () => Promise<T>,
  errorType: AuthErrorType,
  errorMessage?: string,
): Promise<AuthResult<T>> {
  try {
    const data = await operation()
    return { success: true, data }
  }
  catch (error) {
    const authError = error instanceof AuthError
      ? error
      : new AuthError(errorType, errorMessage || '操作失败', error as Error)

    return { success: false, error: authError }
  }
}
