import type { MaybeRefOrGetter } from 'vue'
import type { FORUM } from '~/forum/components/types'
import type { ForumImageResource } from '~/forum/services/forumImageResource'
import type { ForumImageShortcutId } from '~/forum/services/forumShortcuts'
import { createSharedComposable } from '@vueuse/core'
import { computed, toValue } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useForumImageMetadata } from '~/forum/composables/state/useForumImageMetadata'
import { useForumShortcutPreferences } from '~/forum/composables/state/useForumShortcutPreferences'
import { FORUM_SHORTCUTS } from '~/forum/services/forumShortcuts'
import { useForumImageActions } from './useForumImageActions'
import { useForumShortcut } from './useForumShortcut'

export interface ForumImageCommand {
  id: ForumImageShortcutId
  run: () => unknown
  enabled?: MaybeRefOrGetter<boolean>
}

// @unocss-include
const IMAGE_ACTION_ICONS: Record<ForumImageShortcutId, string> = {
  imageOpen: 'i-lucide-image',
  imageToggleZoom: 'i-lucide-scan',
  imagePrevious: 'i-lucide-arrow-left',
  imageNext: 'i-lucide-arrow-right',
  imageZoomIn: 'i-lucide-zoom-in',
  imageZoomOut: 'i-lucide-zoom-out',
  imageReset: 'i-lucide-rotate-ccw',
  imageTop: 'i-lucide-arrow-up-to-line',
  imageBottom: 'i-lucide-arrow-down-to-line',
  imagePanel: 'i-lucide-panel-right',
  imageClose: 'i-lucide-x',
  imageCopy: 'i-lucide-copy',
  imageSave: 'i-lucide-download',
  imageLink: 'i-lucide-link',
  imageNewTab: 'i-lucide-external-link',
  imageMetadata: 'i-lucide-info',
}

const useImageInspectionPermission = createSharedComposable(() => useRuleChecks().hasAnyPermissions('manage_feedback'))

export function useForumImageMenu(image: MaybeRefOrGetter<ForumImageResource>, commands: MaybeRefOrGetter<ForumImageCommand[]>, active: MaybeRefOrGetter<boolean>, accepts: (event: KeyboardEvent, id?: string) => boolean) {
  const { t } = useI18n({ useScope: 'global' })
  const preferences = useForumShortcutPreferences()
  const { busy, copyImage, saveImage, copyLink } = useForumImageActions(image)
  const { inspect } = useForumImageMetadata()
  const canInspect = useImageInspectionPermission()
  const actions = computed<ForumImageCommand[]>(() => [
    ...toValue(commands),
    { id: 'imageCopy', run: copyImage },
    { id: 'imageSave', run: saveImage },
    { id: 'imageLink', run: copyLink },
    { id: 'imageNewTab', run: () => window.open(toValue(image).src, '_blank', 'noopener,noreferrer') },
    ...(canInspect.value ? [{ id: 'imageMetadata' as const, run: () => inspect(toValue(image)) }] : []),
  ])
  const available = (id: ForumImageShortcutId) => actions.value.find(action => action.id === id && (action.enabled === undefined || toValue(action.enabled)))
  const shortcut = preferences.label
  for (const action of FORUM_SHORTCUTS) {
    if (action.group !== 'image')
      continue
    useForumShortcut(action.id, () => available(action.id)?.run(), {
      accepts: event => accepts(event, action.id),
      priority: 10,
      enabled: () => toValue(active) && !!available(action.id),
    })
  }
  const menu = computed<FORUM.MenuElement[]>(() => {
    const groups = [
      ['imageOpen', 'imagePrevious', 'imageNext', 'imageToggleZoom', 'imageZoomIn', 'imageZoomOut', 'imageReset', 'imageTop', 'imageBottom', 'imagePanel', 'imageClose'],
      ['imageCopy', 'imageSave', 'imageLink', 'imageNewTab'],
      ['imageMetadata'],
    ] as const
    return groups.filter(group => group.some(id => available(id))).flatMap((group, index) => [
      ...(index ? [{ type: 'separator' as const }] : []),
      { type: 'group' as const, items: group.filter(id => available(id)).map(id => ({
        type: 'item' as const,
        id,
        label: t(`settings.shortcuts.actions.${id}`),
        icon: IMAGE_ACTION_ICONS[id],
        shortcut: shortcut(id),
        disabled: busy.value && (id === 'imageCopy' || id === 'imageSave' || id === 'imageLink'),
        action: () => available(id)?.run(),
      })) },
    ])
  })
  return { menu, shortcut }
}
