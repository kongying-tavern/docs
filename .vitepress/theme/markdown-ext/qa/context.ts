import type { InjectionKey, Ref } from 'vue'

/**
 * A QA as its group sees it: whether it may be switched, whether it is open,
 * and how to switch it. Both flags are read at call time, so a prop change or
 * a single toggle is honoured by the group.
 */
export interface QaControl {
  readonly collapsible: boolean
  readonly isOpened: Ref<boolean>
  setOpened: (opened: boolean) => void
}

export interface QaGroupApi {
  register: (control: QaControl) => void
  unregister: (control: QaControl) => void
}

/** Absent outside a QAGroup, so a standalone QA keeps working on its own. */
export const qaGroupKey: InjectionKey<QaGroupApi> = Symbol('qaGroup')
