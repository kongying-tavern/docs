import type { InjectionKey } from 'vue'

/**
 * A QA as its group sees it: whether it may be switched, and how to switch it.
 * `collapsible` is read at call time so a prop change is honoured.
 */
export interface QaControl {
  readonly collapsible: boolean
  setOpened: (opened: boolean) => void
}

export interface QaGroupApi {
  register: (control: QaControl) => void
  unregister: (control: QaControl) => void
}

/** Absent outside a QAGroup, so a standalone QA keeps working on its own. */
export const qaGroupKey: InjectionKey<QaGroupApi> = Symbol('qaGroup')
