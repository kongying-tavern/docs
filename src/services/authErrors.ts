export enum AuthErrorType {
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  TOKEN_MISSING = 'TOKEN_MISSING',

  OAUTH_CODE_MISSING = 'OAUTH_CODE_MISSING',
  OAUTH_EXCHANGE_FAILED = 'OAUTH_EXCHANGE_FAILED',
  OAUTH_REDIRECT_FAILED = 'OAUTH_REDIRECT_FAILED',

  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',

  USER_INFO_FETCH_FAILED = 'USER_INFO_FETCH_FAILED',

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

  static isAuthError(error: unknown, type?: AuthErrorType): error is AuthError {
    if (!(error instanceof AuthError))
      return false
    return type ? error.type === type : true
  }

  isRetryable(): boolean {
    return [
      AuthErrorType.NETWORK_ERROR,
      AuthErrorType.TOKEN_REFRESH_FAILED,
      AuthErrorType.SSO_REFRESH_FAILED,
    ].includes(this.type)
  }

  requiresReauth(): boolean {
    return [
      AuthErrorType.TOKEN_EXPIRED,
      AuthErrorType.TOKEN_INVALID,
      AuthErrorType.UNAUTHORIZED,
    ].includes(this.type)
  }

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

export const createAuthError = {
  tokenExpired: (originalError?: Error) =>
    new AuthError(AuthErrorType.TOKEN_EXPIRED, 'Access token expired', originalError),

  tokenInvalid: (originalError?: Error) =>
    new AuthError(AuthErrorType.TOKEN_INVALID, 'Access token invalid', originalError),

  tokenRefreshFailed: (originalError?: Error) =>
    new AuthError(AuthErrorType.TOKEN_REFRESH_FAILED, 'Could not refresh the access token', originalError),

  tokenMissing: () =>
    new AuthError(AuthErrorType.TOKEN_MISSING, 'Access token missing'),

  oauthExchangeFailed: (originalError?: Error) =>
    new AuthError(AuthErrorType.OAUTH_EXCHANGE_FAILED, 'OAuth authorization code exchange failed', originalError),

  networkError: (originalError?: Error) =>
    new AuthError(AuthErrorType.NETWORK_ERROR, 'Network request failed', originalError),

  unauthorized: (originalError?: Error) =>
    new AuthError(AuthErrorType.UNAUTHORIZED, 'Unauthorized request', originalError),

  userInfoFetchFailed: (originalError?: Error) =>
    new AuthError(AuthErrorType.USER_INFO_FETCH_FAILED, 'Could not fetch user profile', originalError),

  ssoRefreshFailed: (originalError?: Error, ssoType?: string) =>
    new AuthError(AuthErrorType.SSO_REFRESH_FAILED, `SSO token refresh failed${ssoType ? `: ${ssoType}` : ''}`, originalError),
}

export type AuthResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: AuthError
}

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
      : new AuthError(errorType, errorMessage || 'Auth operation failed', error as Error)

    return { success: false, error: authError }
  }
}
