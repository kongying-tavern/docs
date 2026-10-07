import type { AuthError, AuthErrorType } from '~/services/authErrors'

/** 认证错误类型到 `forum.auth.errorMessages` 词条的映射 */
export type AuthErrorMessageKey
  = | 'tokenExpired'
    | 'tokenInvalid'
    | 'tokenRefreshFailed'
    | 'tokenMissing'
    | 'oauthExchangeFailed'
    | 'networkError'
    | 'unauthorized'
    | 'userInfoFetchFailed'
    | 'unknown'

const MESSAGE_KEY_BY_TYPE: Record<AuthErrorType, AuthErrorMessageKey> = {
  TOKEN_EXPIRED: 'tokenExpired',
  TOKEN_INVALID: 'tokenInvalid',
  TOKEN_REFRESH_FAILED: 'tokenRefreshFailed',
  TOKEN_MISSING: 'tokenMissing',
  OAUTH_CODE_MISSING: 'oauthExchangeFailed',
  OAUTH_EXCHANGE_FAILED: 'oauthExchangeFailed',
  OAUTH_REDIRECT_FAILED: 'oauthExchangeFailed',
  NETWORK_ERROR: 'networkError',
  API_ERROR: 'unknown',
  UNAUTHORIZED: 'unauthorized',
  USER_INFO_FETCH_FAILED: 'userInfoFetchFailed',
  SSO_REFRESH_FAILED: 'tokenRefreshFailed',
  SSO_LOGOUT_FAILED: 'unknown',
}

export function authErrorMessage(error: AuthError, messages: Record<AuthErrorMessageKey, string>): string {
  return messages[MESSAGE_KEY_BY_TYPE[error.type]]
}
