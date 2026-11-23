import type { Ref } from 'vue'
import type { QaControl } from './context.ts'

import { inject, onBeforeUnmount } from 'vue'
import { qaGroupKey } from './context.ts'

export interface QaGroupControlOptions {
  collapsible: Ref<boolean>
  isOpened: Ref<boolean>
  setOpened: (opened: boolean) => void
}

/**
 * Joins the QAGroup above this QA, if there is one. Registration happens during
 * setup, so the group's list follows reading order, and leaves with the answer.
 */
export function useQaGroupControl(options: QaGroupControlOptions): void {
  const group = inject(qaGroupKey)
  if (!group)
    return

  const control: QaControl = {
    get collapsible() {
      return options.collapsible.value
    },
    isOpened: options.isOpened,
    setOpened: options.setOpened,
  }

  group.register(control)
  onBeforeUnmount(() => group.unregister(control))
}
