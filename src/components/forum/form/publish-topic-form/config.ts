import type { ComputedRef } from 'vue'
import type { TabsConfig } from './types'
import { useLocalized } from '@/hooks/useLocalized'
import { VALIDATION_LIMITS } from '../../constants'

export const TRANSITION_DURATION = 800
export const FORM_HASH = 'PUBLISH-TOPIC'

export function getFormTabsConfig(hasPermission: ComputedRef<boolean>): TabsConfig[] {
  const { message } = useLocalized()

  return [
    {
      value: 'BUG',
      label: `${message.value.forum.publish.type.bug}`,
      condition: true,
      fields: {
        tags: {
          label: message.value.forum.publish.form.type.text,
          placeholder: message.value.forum.publish.form.type.placeholder,
          maxLength: VALIDATION_LIMITS.TAGS.MAX_COUNT,
          minLength: VALIDATION_LIMITS.TAGS.MIN_COUNT,
        },
        content: {
          label: message.value.forum.publish.form.content.text,
          placeholder: message.value.forum.publish.form.content.placeholder,
          maxLength: VALIDATION_LIMITS.CONTENT.MAX_LENGTH,
          minLength: VALIDATION_LIMITS.CONTENT.MIN_LENGTH,
        },
        upload: {
          label: message.value.forum.publish.form.upload.text,
          placeholder: message.value.forum.publish.form.content.placeholder,
        },
      },
    },
    {
      value: 'FEAT',
      label: `${message.value.forum.publish.type.feat}`,
      condition: true,
      fields: {
        title: {
          label: message.value.forum.publish.form.title.text,
          placeholder: message.value.forum.publish.form.title.placeholder,
          maxLength: VALIDATION_LIMITS.TITLE.MAX_LENGTH,
          minLength: VALIDATION_LIMITS.TITLE.MIN_LENGTH,
        },
        tags: {
          label: message.value.forum.publish.form.type.text,
          placeholder: message.value.forum.publish.form.type.placeholder,
          maxLength: VALIDATION_LIMITS.TAGS.MAX_COUNT,
        },
        content: {
          label: message.value.forum.publish.form.content.text,
          placeholder: message.value.forum.publish.form.content.placeholder,
          maxLength: VALIDATION_LIMITS.CONTENT.MAX_LENGTH,
          minLength: VALIDATION_LIMITS.CONTENT.MIN_LENGTH,
        },
        upload: {
          label: message.value.forum.publish.form.upload.text,
          placeholder: message.value.forum.publish.form.content.placeholder,
        },
      },
    },
    {
      value: 'ANN',
      label: `${message.value.forum.publish.type.ann}`,
      condition: hasPermission,
      fields: {
        title: {
          label: message.value.forum.publish.form.title.text,
          placeholder: message.value.forum.publish.form.title.placeholder,
          maxLength: VALIDATION_LIMITS.TITLE.MAX_LENGTH,
          minLength: VALIDATION_LIMITS.TITLE.MIN_LENGTH,
        },
        content: {
          label: message.value.forum.publish.form.content.text,
          placeholder: message.value.forum.publish.form.content.placeholder,
          maxLength: VALIDATION_LIMITS.CONTENT.MAX_LENGTH,
          minLength: VALIDATION_LIMITS.CONTENT.MIN_LENGTH,
        },
        upload: {
          label: message.value.forum.publish.form.upload.text,
          placeholder: message.value.forum.publish.form.content.placeholder,
        },
      },
    },
  ]
}
