import type ForumAPI from '@/apis/forum/api'
import type { ComputedRef } from 'vue'

export interface FieldConfig {
  label: string
  placeholder: string
  maxLength: number
  minLength?: number
}

export type TabsConfig = {
  value: Exclude<ForumAPI.TopicType, null>
  label: string
  condition: boolean | ComputedRef<boolean>
  fields: {
    upload: FieldConfig
    content: FieldConfig
    title?: FieldConfig
    tags?: FieldConfig
    permissions?: FieldConfig
  }
}[]
