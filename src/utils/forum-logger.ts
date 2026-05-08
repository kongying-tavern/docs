/* eslint-disable no-console */
/**
 * 论坛模块统一日志系统
 * 提供分组、等级管理和统一的日志输出接口
 */

export enum ForumLogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export enum ForumLogGroup {
  PRELOADER = 'Preloader',
  BROADCAST = 'Broadcast',
  EVENT_MANAGER = 'EventManager',
  PERMISSION = 'Permission',
  PERFORMANCE = 'Performance',
  CACHE = 'Cache',
  SEARCH = 'Search',
  TOPIC = 'Topic',
  COMMENT = 'Comment',
  ADMIN = 'Admin',
  SERVICE = 'Service',
}

interface ForumLogConfig {
  enabled: boolean
  level: ForumLogLevel
  groupColors: Record<ForumLogGroup, string>
}

class ForumLogger {
  private config: ForumLogConfig = {
    enabled: (typeof import.meta !== 'undefined' && import.meta.env?.DEV) || true,
    level: (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ? ForumLogLevel.DEBUG : ForumLogLevel.WARN,
    groupColors: {
      [ForumLogGroup.PRELOADER]: '#00BCD4',
      [ForumLogGroup.BROADCAST]: '#9C27B0',
      [ForumLogGroup.EVENT_MANAGER]: '#FF9800',
      [ForumLogGroup.PERMISSION]: '#4CAF50',
      [ForumLogGroup.PERFORMANCE]: '#E91E63',
      [ForumLogGroup.CACHE]: '#2196F3',
      [ForumLogGroup.SEARCH]: '#795548',
      [ForumLogGroup.TOPIC]: '#3F51B5',
      [ForumLogGroup.COMMENT]: '#009688',
      [ForumLogGroup.ADMIN]: '#607D8B',
      [ForumLogGroup.SERVICE]: '#FF5722',
    },
  }

  private formatMessage(group: ForumLogGroup, message: string): string {
    return `[${group}]: ${message}`
  }

  private shouldLog(level: ForumLogLevel): boolean {
    return this.config.enabled && level >= this.config.level
  }

  private getGroupStyle(group: ForumLogGroup): string {
    const color = this.config.groupColors[group]
    return `color: ${color}; font-weight: bold;`
  }

  debug(group: ForumLogGroup, message: string, data?: unknown): void {
    if (!this.shouldLog(ForumLogLevel.DEBUG))
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

  info(group: ForumLogGroup, message: string, data?: unknown): void {
    if (!this.shouldLog(ForumLogLevel.INFO))
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

  warn(group: ForumLogGroup, message: string, data?: unknown): void {
    if (!this.shouldLog(ForumLogLevel.WARN))
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

  error(group: ForumLogGroup, message: string, data?: unknown): void {
    if (!this.shouldLog(ForumLogLevel.ERROR))
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
   * 设置日志配置
   */
  setConfig(newConfig: Partial<ForumLogConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 获取当前配置
   */
  getConfig(): ForumLogConfig {
    return { ...this.config }
  }

  /**
   * 临时启用调试模式
   */
  enableDebug(): void {
    this.config.level = ForumLogLevel.DEBUG
    this.config.enabled = true
    this.info(ForumLogGroup.SERVICE, '调试模式已启用')
  }

  /**
   * 禁用调试模式
   */
  disableDebug(): void {
    this.config.level = ForumLogLevel.WARN
    this.info(ForumLogGroup.SERVICE, '调试模式已禁用')
  }
}

// 导出单例实例
export const forumLogger = new ForumLogger()

// 便捷的日志函数
export const forumLog = {
  debug: (group: ForumLogGroup, message: string, data?: unknown) => forumLogger.debug(group, message, data),
  info: (group: ForumLogGroup, message: string, data?: unknown) => forumLogger.info(group, message, data),
  success: (group: ForumLogGroup, message: string, data?: unknown) => forumLogger.info(group, `✅ ${message}`, data),
  warn: (group: ForumLogGroup, message: string, data?: unknown) => forumLogger.warn(group, message, data),
  error: (group: ForumLogGroup, message: string, data?: unknown) => forumLogger.error(group, message, data),
}
