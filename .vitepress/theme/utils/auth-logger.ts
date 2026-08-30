import { createLogger, LogLevel } from '~/utils/logger'

export { LogLevel }

export enum LogGroup {
  TOKEN = 'Token',
  SSO = 'SSO',
  AUTH = 'Auth',
  REFRESH = 'Refresh',
  LOGIN = 'Login',
  OAUTH = 'OAuth',
  AUTH_HELPER = 'Auth Helper',
  TOKEN_MANAGER = 'Token Manager',
  SSO_MANAGER = 'SSO Manager',
}

const authLogger = createLogger<LogGroup>({
  [LogGroup.TOKEN]: '#4CAF50',
  [LogGroup.SSO]: '#2196F3',
  [LogGroup.AUTH]: '#FF9800',
  [LogGroup.REFRESH]: '#9C27B0',
  [LogGroup.LOGIN]: '#FF9800',
  [LogGroup.OAUTH]: '#F44336',
  [LogGroup.AUTH_HELPER]: '#9C27B0',
  [LogGroup.TOKEN_MANAGER]: '#4CAF50',
  [LogGroup.SSO_MANAGER]: '#2196F3',
})

function tokenStatus(group: LogGroup, status: {
  hasToken: boolean
  isValid: boolean
  expiresAt?: string
  action?: string
}): void {
  const statusIcon = status.isValid ? '✅' : '❌'
  authLogger.detailed(group, LogLevel.DEBUG, `Token状态 ${statusIcon} ${status.action || ''}`, {
    有Token: status.hasToken,
    有效状态: status.isValid,
    过期时间: status.expiresAt || '未设置',
  })
}

function ssoStatus(target: string, status: {
  hasToken: boolean
  isValid: boolean
  expiresAt?: string
  action?: string
}): void {
  const statusIcon = status.isValid ? '✅' : '❌'
  authLogger.detailed(LogGroup.SSO_MANAGER, LogLevel.DEBUG, `${target} SSO状态 ${statusIcon} ${status.action || ''}`, {
    平台: target,
    有Token: status.hasToken,
    有效状态: status.isValid,
    过期时间: status.expiresAt || '未设置',
  })
}

export const log = {
  debug: authLogger.debug,
  info: authLogger.info,
  success: authLogger.success,
  warn: authLogger.warn,
  error: authLogger.error,
  tokenStatus,
  ssoStatus,
}
