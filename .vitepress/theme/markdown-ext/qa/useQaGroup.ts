import type { QaControl } from './context.ts'

import { computed, shallowReactive } from 'vue'

/**
 * The QAs a group controls. Children register during their own setup, so the
 * list follows reading order, and an unmounted child takes itself out.
 */
export function useQaGroup() {
  const controls = shallowReactive<QaControl[]>([])

  // Answers without a toggle keep the state they were given, so they neither
  // join a batch nor decide whether that batch is still worth offering.
  const switchable = computed(() => controls.filter(control => control.collapsible))

  function register(control: QaControl) {
    if (!controls.includes(control))
      controls.push(control)
  }

  function unregister(control: QaControl) {
    const index = controls.indexOf(control)
    if (index !== -1)
      controls.splice(index, 1)
  }

  function expandAll() {
    for (const control of switchable.value)
      control.setOpened(true)
  }

  function collapseAll() {
    for (const control of switchable.value)
      control.setOpened(false)
  }

  // Answers sign up during their own setup, which the server runs after it has
  // written the header. An empty list therefore means "not known yet", and the
  // actions stay offered rather than flash as disabled in the static page.
  const known = computed(() => controls.length > 0)

  // Each batch is offered only while it would still change something.
  const canExpand = computed(
    () => !known.value || switchable.value.some(control => !control.isOpened.value),
  )
  const canCollapse = computed(
    () => !known.value || switchable.value.some(control => control.isOpened.value),
  )

  return {
    register,
    unregister,
    expandAll,
    collapseAll,
    canExpand,
    canCollapse,
  }
}
