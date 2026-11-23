import type { QaControl } from './context.ts'

import { shallowReactive } from 'vue'

/**
 * The QAs a group controls. Children register during their own setup, so the
 * list follows reading order, and an unmounted child takes itself out.
 */
export function useQaGroup() {
  const controls = shallowReactive<QaControl[]>([])

  function register(control: QaControl) {
    if (!controls.includes(control))
      controls.push(control)
  }

  function unregister(control: QaControl) {
    const index = controls.indexOf(control)
    if (index !== -1)
      controls.splice(index, 1)
  }

  // Answers without a toggle keep whatever state they were given, so the group
  // only reaches the ones that can actually change.
  function setAll(opened: boolean) {
    for (const control of controls) {
      if (control.collapsible)
        control.setOpened(opened)
    }
  }

  return { register, unregister, setAll }
}
