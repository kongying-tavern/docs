import type { ForumShortcutId } from '~/forum/services/forumShortcuts'
import { useEventListener } from '@vueuse/core'
import { computed, nextTick, onScopeDispose, ref, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumShortcutPreferences } from '~/forum/composables/state/useForumShortcutPreferences'
import { FORUM_SHORTCUTS, shortcutBindingError, shortcutFromEvent } from '~/forum/services/forumShortcuts'

export function useForumShortcutRecorder() {
  const preferences = useForumShortcutPreferences()
  const { message } = useLocalized()
  const selected = ref<ForumShortcutId | null>(null)
  const recorder = ref<HTMLElement | null>(null)
  const draft = ref('')
  const operationError = ref('')
  const copy = computed(() => message.value.settings.shortcuts)
  const groups = computed(() => (['input', 'application'] as const).map(group => ({
    id: group,
    label: copy.value.groups[group],
    actions: FORUM_SHORTCUTS.filter(action => action.group === group).map(({ id }) => {
      const state = preferences.get(id)
      return {
        id,
        label: copy.value.actions[id],
        enabled: state.enabled && !!state.binding,
        unassigned: !state.binding,
        keys: state.binding.replace('Mod', preferences.mac.value ? '⌘' : 'Ctrl').replace('Meta', '⌘').split('+').filter(Boolean),
      }
    }),
  })))
  const bindingError = computed(() => selected.value
    ? shortcutBindingError(selected.value, draft.value, preferences.preferences.value)
    : null)
  function errorText(error: ReturnType<typeof shortcutBindingError>): string {
    if (!error)
      return ''
    return error === 'invalid' || error === 'reserved'
      ? copy.value[error]
      : `${copy.value.conflict}: ${copy.value.actions[error]}`
  }
  const error = computed(() => errorText(bindingError.value))
  const draftKeys = computed(() => draft.value.replace('Mod', preferences.mac.value ? '⌘' : 'Ctrl').split('+').filter(Boolean))
  const open = computed({
    get: () => selected.value !== null,
    set: (value) => {
      if (!value)
        selected.value = null
    },
  })
  watch(selected, value => preferences.recording.value = value !== null, { flush: 'sync' })
  onScopeDispose(() => preferences.recording.value = false)
  useEventListener('keydown', (event: KeyboardEvent) => {
    if (!selected.value)
      return
    if (event.key !== 'Escape' && !(event.target instanceof Element && event.target.closest('[data-shortcut-recorder]')))
      return
    if (event.key === 'Tab')
      return
    // Capture before the surrounding settings dialog or editor sees the chord.
    event.stopImmediatePropagation()
    if (event.isComposing || event.repeat || event.getModifierState('AltGraph'))
      return
    event.preventDefault()
    if (event.key === 'Escape') {
      selected.value = null
      return
    }
    const binding = shortcutFromEvent(event, preferences.mac.value)
    if (binding !== null)
      draft.value = binding
    else if (!['Control', 'Meta', 'Alt', 'Shift'].includes(event.key))
      draft.value = event.key
  }, { capture: true })
  function edit(id: ForumShortcutId) {
    draft.value = preferences.get(id).binding
    selected.value = id
    operationError.value = ''
  }
  function save() {
    if (!selected.value || bindingError.value)
      return
    const result = preferences.update(selected.value, draft.value)
    if (!result)
      selected.value = null
  }
  async function focusRecorder(event: Event) {
    event.preventDefault()
    await nextTick()
    recorder.value?.focus()
  }
  function toggle(id: ForumShortcutId, enabled: boolean) {
    operationError.value = errorText(preferences.update(id, preferences.get(id).binding, enabled))
  }
  function reset() {
    preferences.reset()
    operationError.value = ''
  }
  return { copy, groups, selected, draft, draftKeys, open, error, operationError, recorder, focusRecorder, edit, save, toggle, reset }
}
