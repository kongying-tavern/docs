/* eslint-disable no-console */
/**
 * 认证模块统一日志系统
 * 提供分组、等级管理和统一的日志输出接口
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

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

interface LogConfig {
  enabled: boolean
  level: LogLevel
  groupColors: Record<LogGroup, string>
}

class AuthLogger {
  private config: LogConfig = {
    enabled: import.meta.env.DEV,
    level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN,
    groupColors: {
      [LogGroup.TOKEN]: '#4CAF50',
      [LogGroup.SSO]: '#2196F3',
      [LogGroup.AUTH]: '#FF9800',
      [LogGroup.REFRESH]: '#9C27B0',
      [LogGroup.LOGIN]: '#FF9800',
      [LogGroup.OAUTH]: '#F44336',
      [LogGroup.AUTH_HELPER]: '#9C27B0',
      [LogGroup.TOKEN_MANAGER]: '#4CAF50',
      [LogGroup.SSO_MANAGER]: '#2196F3',
    },
  }

  private formatMessage(group: LogGroup, message: string): string {
    return `[${group}]: ${message}`
  }

  private shouldLog(level: LogLevel): boolean {
    return this.config.enabled && level >= this.config.level
  }

  private getGroupStyle(group: LogGroup): string {
    const color = this.config.groupColors[group]
    return `color: ${color}; font-weight: bold;`
  }

  debug(group: LogGroup, message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.DEBUG))
      return

    if (data !== undefined) {
      console.groupCollapsed(`%c${this.formatMessage(group, message)}`, this.getGroupStyle(group))
      console.debug(data)
      console.groupEnd()
    }
    else {
      console.debug(`%c${this.formatMessage(group, message)}`, this.getGroupStyle(group))
    }
  }

  info(group: LogGroup, message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.INFO))
      return

    if (data !== undefined) {
      console.groupCollapsed(`%c${this.formatMessage(group, message)}`, this.getGroupStyle(group))
      console.info(data)
      console.groupEnd()
    }
    else {
      console.info(`%c${this.formatMessage(group, message)}`, this.getGroupStyle(group))
    }
  }

  warn(group: LogGroup, message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.WARN))
      return

    if (data !== undefined) {
      console.groupCollapsed(`%c${this.formatMessage(group, message)}`, this.getGroupStyle(group))
      console.warn(data)
      console.groupEnd()
    }
    else {
      console.warn(`%c${this.formatMessage(group, message)}`, this.getGroupStyle(group))
    }
  }

  error(group: LogGroup, message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.ERROR))
      return

    if (data !== undefined) {
      console.groupCollapsed(`%c${this.formatMessage(group, message)}`, this.getGroupStyle(group))
      console.error(data)
      console.groupEnd()
    }
    else {
      console.error(`%c${this.formatMessage(group, message)}`, this.getGroupStyle(group))
    }
  }

  /**
   * 创建带时间戳的详细日志
   */
  detailed(group: LogGroup, level: LogLevel, message: string, details: Record<string, unknown>): void {
    if (!this.shouldLog(level))
      return

    const timestamp = new Date().toLocaleTimeString()
    const fullMessage = `${message} (${timestamp})`

    console.group(`%c${this.formatMessage(group, fullMessage)}`, this.getGroupStyle(group))
    Object.entries(details).forEach(([key, value]) => {
      console.log(`${key}:`, value)
    })
    console.groupEnd()
  }

  /**
   * 监控token状态的专用日志
   */
  tokenStatus(group: LogGroup, status: {
    hasToken: boolean
    isValid: boolean
    expiresAt?: string
    action?: string
  }): void {
    if (!this.shouldLog(LogLevel.DEBUG))
      return

    const statusIcon = status.isValid ? '✅' : '❌'
    const message = `Token状态 ${statusIcon} ${status.action || ''}`

    this.detailed(group, LogLevel.DEBUG, message, {
      有Token: status.hasToken,
      有效状态: status.isValid,
      过期时间: status.expiresAt || '未设置',
    })
  }

  /**
   * SSO相关的专用日志
   */
  ssoStatus(target: string, status: {
    hasToken: boolean
    isValid: boolean
    expiresAt?: string
    action?: string
  }): void {
    if (!this.shouldLog(LogLevel.DEBUG))
      return

    const statusIcon = status.isValid ? '✅' : '❌'
    const message = `${target} SSO状态 ${statusIcon} ${status.action || ''}`

    this.detailed(LogGroup.SSO_MANAGER, LogLevel.DEBUG, message, {
      平台: target,
      有Token: status.hasToken,
      有效状态: status.isValid,
      过期时间: status.expiresAt || '未设置',
    })
  }

  /**
   * 设置日志配置
   */
  setConfig(newConfig: Partial<LogConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 获取当前配置
   */
  getConfig(): LogConfig {
    return { ...this.config }
  }

  /**
   * 临时启用调试模式
   */
  enableDebug(): void {
    this.config.level = LogLevel.DEBUG
    this.config.enabled = true
    this.info(LogGroup.AUTH_HELPER, '调试模式已启用')
  }

  /**
   * 禁用调试模式
   */
  disableDebug(): void {
    this.config.level = LogLevel.WARN
    this.info(LogGroup.AUTH_HELPER, '调试模式已禁用')
  }
}

// 导出单例实例
export const authLogger = new AuthLogger()

// 便捷的日志函数
export const log = {
  debug: (group: LogGroup, message: string, data?: unknown) => authLogger.debug(group, message, data),
  info: (group: LogGroup, message: string, data?: unknown) => authLogger.info(group, message, data),
  success: (group: LogGroup, message: string, data?: unknown) => authLogger.info(group, `✅ ${message}`, data),
  warn: (group: LogGroup, message: string, data?: unknown) => authLogger.warn(group, message, data),
  error: (group: LogGroup, message: string, data?: unknown) => authLogger.error(group, message, data),
  tokenStatus: (group: LogGroup, status: Parameters<typeof authLogger.tokenStatus>[1]) =>
    authLogger.tokenStatus(group, status),
  ssoStatus: (target: string, status: Parameters<typeof authLogger.ssoStatus>[1]) =>
    authLogger.ssoStatus(target, status),
}
