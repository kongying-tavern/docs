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
