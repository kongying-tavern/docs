import type { Ref } from 'vue'
import type { QaControl } from './context.ts'

import { inject, onBeforeUnmount } from 'vue'
import { qaGroupKey } from './context.ts'

/**
 * Joins the QAGroup above this QA, if there is one. Registration happens during
 * setup, so the group's list follows reading order, and leaves with the answer.
 */
export function useQaGroupControl(
  collapsible: Ref<boolean>,
  setOpened: (opened: boolean) => void,
): void {
  const group = inject(qaGroupKey)
  if (!group)
    return

  const control: QaControl = {
    get collapsible() {
      return collapsible.value
    },
    setOpened,
  }

  group.register(control)
  onBeforeUnmount(() => group.unregister(control))
}
