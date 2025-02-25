export type VersionType =
  | 'Beta'
  | 'Alpha'
  | 'RC'
  | 'Stable'
  | 'Test'
  | 'Release'

export interface ReleaseActions {
  text: string
  link: string
}

interface Release {
  version: string
  type: VersionType
  description?: string
  date: string
  warning?: string
  hash?: string
  features?: string[]
  fixed?: string[]
  optimized?: string[]
  breaking?: string[]
  inProgress?: boolean
  actions?: ReleaseActions[]
}

export type ReleasesData = Release[]

export interface ReleaseItem {
  type: VersionType
  version: string
  title?: string
  date?: string | number
  description?: string
  warning?: string
  hash?: string
  fixed?: string[]
  features?: string[]
  optimized?: string[]
  breaking?: string[]
  inProgress?: boolean
  actions?: ReleaseActions[]
  feedbackLink?: string
}
