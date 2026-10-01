import type { ForumShortcutId, ShortcutPreferences } from '~/forum/services/forumShortcuts'
import { createGlobalState, useLocalStorage, useMounted } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { normalizeShortcutPreferences, resolveShortcut, shortcutBindingError } from '~/forum/services/forumShortcuts'

const MAC_PLATFORM = /Mac|iPhone|iPad/

export const useForumShortcutPreferences = createGlobalState(() => {
  const stored = useLocalStorage<ShortcutPreferences>('forum-keyboard-shortcuts-v1', { overrides: {} })
  const preferences = computed(() => normalizeShortcutPreferences(stored.value))
  const { desktopUi } = useSitePreferences()
  const mounted = useMounted()
  const mac = computed(() => mounted.value && MAC_PLATFORM.test(navigator.platform))
  const recording = ref(false)
  const get = (id: ForumShortcutId) => resolveShortcut(preferences.value, id)
  const active = (id: ForumShortcutId) => desktopUi.value && get(id).enabled && !!get(id).binding
  function update(id: ForumShortcutId, binding: string, actionEnabled = get(id).enabled) {
    const error = actionEnabled ? shortcutBindingError(id, binding, preferences.value) : null
    if (error)
      return error
    stored.value = { ...preferences.value, overrides: { ...preferences.value.overrides, [id]: { binding, enabled: actionEnabled } } }
    return null
  }
  function reset() {
    stored.value = { overrides: {} }
  }
  return { preferences, desktopUi, mac, recording, get, active, update, reset }
})
