export interface NotificationAction {
  click?: (...args: any[]) => void
  label?: string
}

export interface Notification {
  id: string
  title: string
  description?: string
  icon?: string
  closeButton?: boolean
  timeout: number
  actions?: NotificationAction[]
  click?: (...args: unknown[]) => void
  callback?: (...args: unknown[]) => void
  color?: string
  ui?: any
}
