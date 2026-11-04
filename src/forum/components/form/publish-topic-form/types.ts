import type { ComputedRef } from 'vue'
import type ForumAPI from '~/forum/api/types'

export interface FieldConfig {
  label: string
  placeholder: string
  maxLength: number
  minLength?: number
}

export interface TabsConfig {
  value: ForumAPI.FeedbackTopicType
  label: string
  condition: boolean | ComputedRef<boolean>
  fields: {
    content: FieldConfig
    title?: FieldConfig
    tags?: FieldConfig
    permissions?: FieldConfig
  }
}
