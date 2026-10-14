<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useLocalized } from '@/hooks/useLocalized'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useForumImageMetadata } from '~/forum/composables/state/useForumImageMetadata'
import { fetchImageResource } from '~/forum/services/forumImageResource'

const { open, image } = useForumImageMetadata()
const { message } = useLocalized()
const { hasAnyPermissions } = useRuleChecks()
const canInspect = hasAnyPermissions('manage_feedback')
const copy = computed(() => message.value.forum.imageActions)
const loading = ref(false)
const failed = ref(false)
const resource = ref<{ size: number, type: string, lastModified: string | null, width: number, height: number }>()
let controller: AbortController | undefined
watch([open, image, canInspect], async () => {
  controller?.abort()
  resource.value = undefined
  failed.value = false
  loading.value = false
  if (!canInspect.value) {
    open.value = false
    return
  }
  if (!open.value || !image.value)
    return
  const request = new AbortController()
  controller = request
  loading.value = true
  try {
    const { blob, ...info } = await fetchImageResource(image.value.src, request.signal)
    const bitmap = await createImageBitmap(blob)
    try {
      if (!request.signal.aborted)
        resource.value = { ...info, width: bitmap.width, height: bitmap.height }
    }
    finally {
      bitmap.close()
    }
  }
  catch {
    if (!request.signal.aborted)
      failed.value = true
  }
  finally {
    if (!request.signal.aborted)
      loading.value = false
  }
}, { immediate: true })
onScopeDispose(() => controller?.abort())
const rows = computed(() => {
  const data = resource.value
  const width = data?.width ?? image.value?.naturalWidth
  const height = data?.height ?? image.value?.naturalHeight
  return [
    [copy.value.dimensions, width && height ? `${width} × ${height}` : copy.value.unknown],
    [copy.value.ratio, width && height ? `${width} : ${height} (${(width / height).toFixed(4)})` : copy.value.unknown],
    [copy.value.size, data ? `${data.size.toLocaleString()} B` : copy.value.unknown],
    [copy.value.type, data?.type || copy.value.unknown],
    [copy.value.modified, data?.lastModified || copy.value.unknown],
  ]
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent v-if="canInspect" data-image-metadata class="forum-image-metadata" overlay-class="forum-image-metadata-overlay">
      <DialogTitle>{{ message.settings.shortcuts.actions.imageMetadata }}</DialogTitle>
      <DialogDescription>{{ image?.alt || image?.src }}</DialogDescription>
      <p v-if="loading" role="status">
        {{ copy.loading }}
      </p>
      <p v-if="failed" role="alert" class="text-muted-foreground">
        {{ copy.loadFailed }}
      </p>
      <dl class="text-sm gap-x-4 gap-y-2 grid grid-cols-[auto_minmax(0,1fr)]">
        <template v-for="[label, value] in rows" :key="label">
          <dt class="text-muted-foreground">
            {{ label }}
          </dt>
          <dd class="m-0 break-all">
            {{ value }}
          </dd>
        </template>
      </dl>
      <h3 class="text-sm font-medium">
        {{ copy.raw }}
      </h3>
      <pre class="text-xs panel-scrollbar max-h-64 select-text whitespace-pre-wrap break-all overflow-auto">{{ JSON.stringify(image, null, 2) }}</pre>
    </DialogContent>
  </Dialog>
</template>

<style>
/* Match the existing preview portal layer; inspecting an image keeps the preview open. */
body:has(.forum-preview-root) .forum-image-metadata,
body:has(.forum-preview-root) .forum-image-metadata-overlay {
  z-index: 1003;
}
</style>
