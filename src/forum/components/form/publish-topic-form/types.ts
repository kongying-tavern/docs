import type { ComputedRef } from 'vue'
import type ForumAPI from '@/apis/forum/api'

export interface FieldConfig {
  label: string
  placeholder: string
  maxLength: number
  minLength?: number
}

export interface UploadFieldConfig {
  label: string
  placeholder: string
}

export interface TabsConfig {
  value: Exclude<ForumAPI.TopicType, null>
  label: string
  condition: boolean | ComputedRef<boolean>
  fields: {
    upload: UploadFieldConfig
    content: FieldConfig
    title?: FieldConfig
    tags?: FieldConfig
    permissions?: FieldConfig
  }
}
