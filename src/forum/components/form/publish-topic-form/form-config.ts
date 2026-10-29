import type { ComputedRef } from 'vue'
import type { Composer } from 'vue-i18n'
import type { TabsConfig } from './types'
import { VALIDATION_LIMITS } from '~/forum/services/forumConfig'

export const TRANSITION_DURATION = 480
export const FORM_HASH = 'PUBLISH-TOPIC'

export function getFormTabsConfig(
  t: Composer['t'],
  hasPermission: ComputedRef<boolean>,
): TabsConfig[] {
  return [
    {
      value: 'BUG',
      label: `${t('forum.publish.type.bug')}`,
      condition: true,
      fields: {
        tags: {
          label: t('forum.publish.form.type.text'),
          placeholder: t('forum.publish.form.type.placeholder'),
          maxLength: VALIDATION_LIMITS.TAGS.MAX_COUNT,
          minLength: VALIDATION_LIMITS.TAGS.MIN_COUNT,
        },
        content: {
          label: t('forum.publish.form.content.text'),
          placeholder: t('forum.publish.form.content.placeholder'),
          maxLength: VALIDATION_LIMITS.CONTENT.MAX_LENGTH,
          minLength: VALIDATION_LIMITS.CONTENT.MIN_LENGTH,
        },
        upload: {
          label: t('forum.publish.form.upload.text'),
          placeholder: t('forum.publish.form.content.placeholder'),
        },
      },
    },
    {
      value: 'FEAT',
      label: `${t('forum.publish.type.feat')}`,
      condition: true,
      fields: {
        title: {
          label: t('forum.publish.form.title.text'),
          placeholder: t('forum.publish.form.title.placeholder'),
          maxLength: VALIDATION_LIMITS.TITLE.MAX_LENGTH,
          minLength: VALIDATION_LIMITS.TITLE.MIN_LENGTH,
        },
        tags: {
          label: t('forum.publish.form.type.text'),
          placeholder: t('forum.publish.form.type.placeholder'),
          maxLength: VALIDATION_LIMITS.TAGS.MAX_COUNT,
        },
        content: {
          label: t('forum.publish.form.content.text'),
          placeholder: t('forum.publish.form.content.placeholder'),
          maxLength: VALIDATION_LIMITS.CONTENT.MAX_LENGTH,
          minLength: VALIDATION_LIMITS.CONTENT.MIN_LENGTH,
        },
        upload: {
          label: t('forum.publish.form.upload.text'),
          placeholder: t('forum.publish.form.content.placeholder'),
        },
      },
    },
    {
      value: 'ANN',
      label: `${t('forum.publish.type.ann')}`,
      condition: hasPermission,
      fields: {
        title: {
          label: t('forum.publish.form.title.text'),
          placeholder: t('forum.publish.form.title.placeholder'),
          maxLength: VALIDATION_LIMITS.TITLE.MAX_LENGTH,
          minLength: VALIDATION_LIMITS.TITLE.MIN_LENGTH,
        },
        content: {
          label: t('forum.publish.form.content.text'),
          placeholder: t('forum.publish.form.content.placeholder'),
          maxLength: VALIDATION_LIMITS.CONTENT.MAX_LENGTH,
          minLength: VALIDATION_LIMITS.CONTENT.MIN_LENGTH,
        },
        upload: {
          label: t('forum.publish.form.upload.text'),
          placeholder: t('forum.publish.form.content.placeholder'),
        },
      },
    },
  ]
}
