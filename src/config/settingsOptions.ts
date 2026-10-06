import type { ToasterProps } from 'vue-sonner'

export type MotionPreference = 'system' | 'reduce' | 'no-preference'
export type ThemePreference = 'light' | 'dark' | 'auto'
export type ToastPosition = NonNullable<ToasterProps['position']>

export const SETTINGS_SECTION_DEFINITIONS = [
  { id: 'profile', group: 'account', icon: 'i-lucide-user-round', standalone: true },
  { id: 'appearance', group: 'website', icon: 'i-lucide-palette', standalone: false },
  { id: 'notifications', group: 'website', icon: 'i-lucide-bell', standalone: false },
  { id: 'language', group: 'website', icon: 'i-lucide-languages', standalone: false },
  { id: 'privacy', group: 'website', icon: 'i-lucide-shield-check', standalone: false },
  { id: 'labels', group: 'application', icon: 'i-lucide-tags', standalone: true },
  { id: 'experiments', group: 'application', icon: 'i-lucide-flask-conical', standalone: true },
  { id: 'shortcuts', group: 'application', icon: 'i-lucide-keyboard', standalone: true },
] as const

export type SettingsSectionId = typeof SETTINGS_SECTION_DEFINITIONS[number]['id']
export type SettingsSectionGroup = typeof SETTINGS_SECTION_DEFINITIONS[number]['group']

export function isSettingsSectionId(value: string): value is SettingsSectionId {
  return SETTINGS_SECTION_DEFINITIONS.some(section => section.id === value)
}

export const THEME_OPTION_DEFINITIONS = [
  { value: 'light', labelKey: 'light', icon: 'i-lucide-sun' },
  { value: 'dark', labelKey: 'dark', icon: 'i-lucide-moon' },
  { value: 'auto', labelKey: 'auto', icon: 'i-lucide-monitor' },
] as const satisfies ReadonlyArray<{
  value: ThemePreference
  labelKey: 'light' | 'dark' | 'auto'
  icon: string
}>

export const MOTION_OPTION_DEFINITIONS = [
  { value: 'system', labelKey: 'motionSystem', icon: 'i-lucide-monitor' },
  { value: 'reduce', labelKey: 'motionOn', icon: 'i-lucide-circle-pause' },
  { value: 'no-preference', labelKey: 'motionOff', icon: 'i-lucide-circle-play' },
] as const satisfies ReadonlyArray<{
  value: MotionPreference
  labelKey: 'motionSystem' | 'motionOn' | 'motionOff'
  icon: string
}>

export const TOAST_POSITION_DEFINITIONS = [
  { value: 'top-left', labelKey: 'topLeft', icon: 'i-lucide-move-up-left' },
  { value: 'top-center', labelKey: 'topCenter', icon: 'i-lucide-arrow-up-to-line' },
  { value: 'top-right', labelKey: 'topRight', icon: 'i-lucide-move-up-right' },
  { value: 'bottom-left', labelKey: 'bottomLeft', icon: 'i-lucide-move-down-left' },
  { value: 'bottom-center', labelKey: 'bottomCenter', icon: 'i-lucide-arrow-down-to-line' },
  { value: 'bottom-right', labelKey: 'bottomRight', icon: 'i-lucide-move-down-right' },
] as const satisfies ReadonlyArray<{
  value: ToastPosition
  labelKey: 'topLeft' | 'topCenter' | 'topRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight'
  icon: string
}>

export const TOAST_POSITIONS = TOAST_POSITION_DEFINITIONS.map(option => option.value)

export const TOAST_DURATION_DEFINITIONS = [
  { value: 2500, labelKey: 'fast' },
  { value: 4000, labelKey: 'default' },
  { value: 8000, labelKey: 'slow' },
  { value: Number.POSITIVE_INFINITY, labelKey: 'persistent' },
] as const

export const DEFAULT_TOAST_DURATION = 4000

export function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_OPTION_DEFINITIONS.some(option => option.value === value)
}

export function isMotionPreference(value: unknown): value is MotionPreference {
  return MOTION_OPTION_DEFINITIONS.some(option => option.value === value)
}

export function isToastPosition(value: unknown): value is ToastPosition {
  return TOAST_POSITIONS.includes(value as ToastPosition)
}
