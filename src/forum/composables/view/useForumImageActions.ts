import type { MaybeRefOrGetter } from 'vue'
import type { ForumImageResource } from '~/forum/services/forumImageResource'
import { useClipboard, useClipboardItems, useFileSystemAccess, useObjectUrl } from '@vueuse/core'
import { nextTick, onScopeDispose, ref, shallowRef, toValue } from 'vue'
import { toast } from 'vue-sonner'
import { useLocalized } from '@/hooks/useLocalized'
import { fetchImageResource, imageClipboardBlob, imageFileName } from '~/forum/services/forumImageResource'

export function useForumImageActions(image: MaybeRefOrGetter<ForumImageResource>) {
  const { message } = useLocalized()
  const clipboard = useClipboard()
  const imageClipboard = useClipboardItems()
  const fileSystem = useFileSystemAccess({ dataType: 'Blob' })
  const downloadBlob = shallowRef<Blob>()
  const downloadUrl = useObjectUrl(downloadBlob)
  const busy = ref(false)
  let controller: AbortController | undefined
  onScopeDispose(() => controller?.abort())
  async function resource(value: ForumImageResource) {
    return (await fetchImageResource(value.src, controller?.signal)).blob
  }
  async function perform(action: () => Promise<unknown>, success = message.value.forum.imageActions.copied) {
    if (busy.value)
      return
    busy.value = true
    controller = new AbortController()
    try {
      await action()
      if (!controller.signal.aborted)
        toast.success(success)
    }
    catch (error) {
      if (!controller.signal.aborted && !(error instanceof DOMException && error.name === 'AbortError'))
        toast.error(message.value.forum.imageActions.failed)
    }
    finally {
      busy.value = false
    }
  }
  function copyImage() {
    const value = toValue(image)
    return perform(() => {
      if (!imageClipboard.isSupported.value || typeof ClipboardItem === 'undefined')
        throw new Error('Clipboard unavailable')
      // Start clipboard.write within the user gesture, before fetching/decoding.
      return imageClipboard.copy([new ClipboardItem({ 'image/png': resource(value).then(imageClipboardBlob) })])
    })
  }
  function copyLink() {
    return perform(() => {
      if (!clipboard.isSupported.value)
        throw new Error('Clipboard unavailable')
      return clipboard.copy(toValue(image).src)
    })
  }
  function saveImage() {
    const value = toValue(image)
    return perform(async () => {
      if (fileSystem.isSupported.value) {
        // Open the picker before awaiting the network, preserving user activation.
        await fileSystem.create({ suggestedName: imageFileName(value) })
        fileSystem.data.value = await resource(value)
        controller?.signal.throwIfAborted()
        await fileSystem.save()
      }
      else {
        downloadBlob.value = await resource(value)
        // useObjectUrl synchronizes its URL in the Vue watcher queue.
        await nextTick()
        controller?.signal.throwIfAborted()
        const anchor = document.createElement('a')
        anchor.href = downloadUrl.value!
        anchor.download = imageFileName(value)
        anchor.click()
      }
    }, message.value.forum.imageActions.saved)
  }
  return { busy, copyImage, copyLink, saveImage }
}
