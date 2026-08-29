import type { MaybeRefOrGetter } from 'vue'
import { useDropZone } from '@vueuse/core'
import { toValue } from 'vue'

export function useForumImageDropZone(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: {
    disabled?: MaybeRefOrGetter<boolean>
    onFiles: (files: File[]) => void
  },
) {
  return useDropZone(target, {
    multiple: true,
    preventDefaultForUnhandled: true,
    checkValidity: items => !toValue(options.disabled)
      && [...items].some(item => item.kind === 'file'),
    onDrop: (files) => {
      if (!toValue(options.disabled) && files?.length)
        options.onFiles(files)
    },
  })
}
