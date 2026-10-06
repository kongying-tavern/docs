import { createGlobalState } from '@vueuse/core'
import { readonly, shallowRef } from 'vue'

interface ToastDiagnostics {
  title: string
  content: string
}

/** Independent of the transient toast, so dismissing it cannot lose an open diagnostic. */
export const useToastDiagnostics = createGlobalState(() => {
  const diagnostics = shallowRef<ToastDiagnostics | null>(null)
  let trigger: HTMLElement | null = null
  return {
    diagnostics: readonly(diagnostics),
    openDiagnostics: (value: ToastDiagnostics, element: HTMLElement) => {
      trigger = element
      diagnostics.value = { ...value }
    },
    closeDiagnostics: () => diagnostics.value = null,
    restoreDiagnosticsFocus: (event: Event) => {
      if (trigger?.isConnected) {
        event.preventDefault()
        trigger.focus()
      }
      trigger = null
    },
  }
})
