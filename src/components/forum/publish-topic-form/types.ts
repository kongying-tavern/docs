import type ForumAPI from '@/apis/forum/api'
import type { ComputedRef } from 'vue'

export type FieldConfig = {
  label: string
  placeholder: string
  maxLength: number
}

export type TabsConfig = {
  value: Exclude<ForumAPI.TopicType, null>
  label: string
  condition: boolean | ComputedRef<Boolean>
  fields: {
    upload: FieldConfig
    content: FieldConfig
    title?: FieldConfig
    tags?: FieldConfig
    permissions?: FieldConfig
  }
}[]
