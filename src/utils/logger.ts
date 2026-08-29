/* eslint-disable no-console */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LoggerConfig {
  enabled: boolean
  level: LogLevel
  colors: Record<string, string>
}

export interface GroupedLogger<G extends string> {
  debug: (group: G, message: string, data?: unknown) => void
  info: (group: G, message: string, data?: unknown) => void
  warn: (group: G, message: string, data?: unknown) => void
  error: (group: G, message: string, data?: unknown) => void
  success: (group: G, message: string, data?: unknown) => void
  detailed: (group: G, level: LogLevel, message: string, details: Record<string, unknown>) => void
  setConfig: (newConfig: Partial<LoggerConfig>) => void
  getConfig: () => LoggerConfig
  enableDebug: () => void
  disableDebug: () => void
}

const isDev = typeof import.meta !== 'undefined' && !!import.meta.env?.DEV

export function createLogger<G extends string>(
  colors: Record<G, string>,
  overrides: Partial<LoggerConfig> = {},
): GroupedLogger<G> {
  let config: LoggerConfig = {
    enabled: isDev,
    level: isDev ? LogLevel.DEBUG : LogLevel.WARN,
    colors,
    ...overrides,
  }

  const formatMessage = (group: G, message: string): string => `[${group}]: ${message}`
  const shouldLog = (level: LogLevel): boolean => config.enabled && level >= config.level
  const groupStyle = (group: G): string => `color: ${config.colors[group]}; font-weight: bold;`

  function logAt(level: LogLevel, group: G, message: string, data?: unknown): void {
    if (!shouldLog(level))
      return
    const styled = `%c${formatMessage(group, message)}`
    const style = groupStyle(group)
    if (data !== undefined) {
      console.groupCollapsed(styled, style)
      console[level === LogLevel.DEBUG ? 'debug' : level === LogLevel.INFO ? 'info' : level === LogLevel.WARN ? 'warn' : 'error'](data)
      console.groupEnd()
    }
    else {
      console[level === LogLevel.DEBUG ? 'debug' : level === LogLevel.INFO ? 'info' : level === LogLevel.WARN ? 'warn' : 'error'](styled, style)
    }
  }

  return {
    debug: (group, message, data) => logAt(LogLevel.DEBUG, group, message, data),
    info: (group, message, data) => logAt(LogLevel.INFO, group, message, data),
    warn: (group, message, data) => logAt(LogLevel.WARN, group, message, data),
    error: (group, message, data) => logAt(LogLevel.ERROR, group, message, data),
    success: (group, message, data) => logAt(LogLevel.INFO, group, `✅ ${message}`, data),
    detailed: (group, level, message, details) => {
      if (!shouldLog(level))
        return
      const timestamp = new Date().toLocaleTimeString()
      console.group(`%c${formatMessage(group, `${message} (${timestamp})`)}`, groupStyle(group))
      Object.entries(details).forEach(([key, value]) => {
        console.log(`${key}:`, value)
      })
      console.groupEnd()
    },
    setConfig: (newConfig) => {
      config = { ...config, ...newConfig }
    },
    getConfig: () => ({ ...config }),
    enableDebug: () => {
      config.level = LogLevel.DEBUG
      config.enabled = true
    },
    disableDebug: () => {
      config.level = LogLevel.WARN
    },
  }
}
