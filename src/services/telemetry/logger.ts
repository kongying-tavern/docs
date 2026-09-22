import { createLogger } from '~/utils/logger'

export enum TelemetryLogGroup {
  ERROR = 'TelemetryError',
  OPERATION = 'TelemetryOperation',
  VUE = 'VueError',
}

const logger = createLogger<TelemetryLogGroup>({
  [TelemetryLogGroup.ERROR]: '#E91E63',
  [TelemetryLogGroup.OPERATION]: '#009688',
  [TelemetryLogGroup.VUE]: '#F44336',
}, { enabled: true })

export const telemetryLog = {
  info: logger.info,
  error: logger.error,
}
