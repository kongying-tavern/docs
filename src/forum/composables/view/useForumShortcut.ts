import type { MaybeRefOrGetter } from 'vue'
import type { ForumShortcutId } from '~/forum/services/forumShortcuts'
import { createSharedComposable, useEventListener } from '@vueuse/core'
import { onScopeDispose, toValue } from 'vue'
import { useForumShortcutPreferences } from '~/forum/composables/state/useForumShortcutPreferences'
import { FORUM_SHORTCUTS, matchesShortcut } from '~/forum/services/forumShortcuts'

interface ShortcutRegistration {
  id: ForumShortcutId
  run: () => unknown
  enabled?: MaybeRefOrGetter<boolean>
  priority?: number
}

const useDispatcher = createSharedComposable(() => {
  const preferences = useForumShortcutPreferences()
  const registrations = new Set<ShortcutRegistration>()
  useEventListener('keydown', (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.getModifierState('AltGraph') || preferences.recording.value)
      return
    const target = event.target instanceof Element ? event.target : null
    if (target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'))
      return
    const candidates = [...registrations].toSorted((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    const overlayOpen = document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"][data-state="open"], [role="listbox"][data-state="open"]')
    if (!overlayOpen) {
      for (const registration of candidates) {
        if (preferences.active(registration.id) && (registration.enabled === undefined || toValue(registration.enabled))
          && matchesShortcut(preferences.get(registration.id).binding, event)) {
          event.preventDefault()
          event.stopImmediatePropagation()
          if (!event.repeat)
            registration.run()
          return
        }
      }
    }
    // Disabled bindings and the site's original / must not fall through to other handlers.
    if (preferences.desktopUi.value && (candidates.some(registration => matchesShortcut(preferences.get(registration.id).binding, event))
      || (candidates.some(registration => registration.id === 'search') && matchesShortcut(FORUM_SHORTCUTS.find(action => action.id === 'search')!.binding, event)))) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  }, { capture: true })
  return registrations
})

/** Components supply only their action and availability; scope, settings and cleanup live here. */
export function useForumShortcut(id: ForumShortcutId, run: () => unknown, options: Omit<ShortcutRegistration, 'id' | 'run'> = {}) {
  const registrations = useDispatcher()
  const registration = { id, run, ...options }
  registrations.add(registration)
  onScopeDispose(() => registrations.delete(registration))
}
