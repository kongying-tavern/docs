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
  accepts?: (event: KeyboardEvent) => boolean
}

const useDispatcher = createSharedComposable(() => {
  const preferences = useForumShortcutPreferences()
  const registrations = new Set<ShortcutRegistration>()
  useEventListener('keydown', (event: KeyboardEvent) => {
    if (!preferences.desktopUi.value || event.defaultPrevented || event.isComposing || event.getModifierState('AltGraph') || preferences.recording.value)
      return
    const target = event.target instanceof Element ? event.target : null
    if (target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'))
      return
    // Match keys before running per-image scope checks or querying the document.
    const matchingIds = new Set(FORUM_SHORTCUTS.filter(action => matchesShortcut(preferences.get(action.id).binding, event)).map(action => action.id))
    const matchesOriginalSearch = matchesShortcut(FORUM_SHORTCUTS.find(action => action.id === 'search')!.binding, event)
    if (!matchingIds.size && !matchesOriginalSearch)
      return
    const candidates = [...registrations]
      .filter(registration => matchingIds.has(registration.id)
        && (registration.enabled === undefined || toValue(registration.enabled)))
      .toSorted((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    const originalSearch = matchesOriginalSearch
      && [...registrations].some(registration => registration.id === 'search')
    if (!candidates.length && !originalSearch)
      return
    const overlayOpen = candidates.some(registration => !registration.accepts)
      && document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"][data-state="open"], [role="listbox"][data-state="open"]')
    let consume = originalSearch
    for (const registration of candidates) {
      if (!(registration.accepts ? registration.accepts(event) : !overlayOpen))
        continue
      consume = true
      if (preferences.active(registration.id)) {
        event.preventDefault()
        event.stopImmediatePropagation()
        if (!event.repeat)
          registration.run()
        return
      }
    }
    // Disabled bindings and the site's original / must not fall through to other handlers.
    if (consume) {
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
