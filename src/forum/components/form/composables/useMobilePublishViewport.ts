import type { Ref } from 'vue'
import { useMobileEditorViewport } from '~/forum/composables/view/useMobileEditorViewport'

export function useMobilePublishViewport(isOpen: Ref<boolean>, isDesktop: Ref<boolean>, form: Readonly<Ref<HTMLFormElement | null>>) {
  return useMobileEditorViewport(isOpen, isDesktop, form, '.compact-body')
}
