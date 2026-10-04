import type { Component, InjectionKey, Ref } from 'vue'

export type SwipeSide = 'leading' | 'trailing'

export interface SwipeAction {
  /** Stable within its side. */
  id: string
  label: string
  icon?: Component
  tone?: 'neutral' | 'accent' | 'danger'
  disabled?: boolean
  /** Remove the item in this callback; rejection restores the row and emits actionError. */
  onSelect: () => void | Promise<void>
  keepRow?: boolean
}

export interface SwipeActionsContext {
  openId: Ref<string | null>
  rows: Map<string, HTMLElement>
  list: Ref<HTMLElement | undefined>
}

export const swipeActionsKey: InjectionKey<SwipeActionsContext> = Symbol('SwipeActions')
