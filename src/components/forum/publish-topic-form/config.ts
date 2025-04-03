import type ForumAPI from '@/apis/forum/api'
import type { TabsConfig } from './types'
import { useLocalized } from '@/hooks/useLocalized'
import { readonly } from 'vue'
import { useRuleChecks } from '~/composables/useRuleChecks'

export const MAX_UPLOAD_FILE_SIZE = 6
export const TRANSITION_DURATION = 800
export const FORM_DATA_KEY = 'PUBLISH-TOPIC-FORM-DATA-KEY'
export const FORM_HASH = 'PUBLISH-TOPIC'
export const FORM_DEFAULT_DATA: ForumAPI.CreateTopicOption = {
  type: 'BUG',
  title: '',
  tags: [],
  text: '',
}

export function getFormTabsConfig() {
  const { message } = useLocalized()
  const { hasAnyPermissions } = useRuleChecks()

  const hasPermission = hasAnyPermissions('manage_feedback')

  return readonly<TabsConfig>([
    {
      value: 'BUG',
      label: `🐛${message.value.forum.publish.type.bug}`,
      condition: true,
      fields: {
        tags: {
          label: message.value.forum.publish.form.type.text,
          placeholder: message.value.forum.publish.form.type.placeholder,
          maxLength: 5,
          minLength: 1,
        },
        content: {
          label: message.value.forum.publish.form.content.text,
          placeholder: message.value.forum.publish.form.content.placeholder,
          maxLength: 2000,
          minLength: 5,
        },
        upload: {
          label: message.value.forum.publish.form.upload.text,
          placeholder: message.value.forum.publish.form.content.placeholder,
          maxLength: 3,
        },
      },
    },
    {
      value: 'FEAT',
      label: `💡${message.value.forum.publish.type.feat}`,
      condition: true,
      fields: {
        title: {
          label: message.value.forum.publish.form.title.text,
          placeholder: message.value.forum.publish.form.title.placeholder,
          maxLength: 50,
          minLength: 1,
        },
        tags: {
          label: message.value.forum.publish.form.type.text,
          placeholder: message.value.forum.publish.form.type.placeholder,
          maxLength: 5,
        },
        content: {
          label: message.value.forum.publish.form.content.text,
          placeholder: message.value.forum.publish.form.content.placeholder,
          maxLength: 2000,
          minLength: 5,
        },
        upload: {
          label: message.value.forum.publish.form.upload.text,
          placeholder: message.value.forum.publish.form.content.placeholder,
          maxLength: 3,
        },
      },
    },
    {
      value: 'ANN',
      label: '📌发公告',
      condition: hasPermission,
      fields: {
        title: {
          label: message.value.forum.publish.form.title.text,
          placeholder: message.value.forum.publish.form.title.placeholder,
          maxLength: 50,
          minLength: 1,
        },
        content: {
          label: message.value.forum.publish.form.content.text,
          placeholder: message.value.forum.publish.form.content.placeholder,
          maxLength: 2000,
          minLength: 5,
        },
        upload: {
          label: message.value.forum.publish.form.upload.text,
          placeholder: message.value.forum.publish.form.content.placeholder,
          maxLength: 3,
        },
      },
    },
  ])
}
