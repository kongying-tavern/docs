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
  click?: (...args: any[]) => void
  callback?: (...args: any[]) => void
  color?: string
  ui?: any
}
