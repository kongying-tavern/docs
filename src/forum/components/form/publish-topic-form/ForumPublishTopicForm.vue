<script setup lang="ts">
import type { PublishTopicPresentation } from '../composables/usePublishTopicController'
import { h, useTemplateRef, watch } from 'vue'
import { defineRecoverableAsyncComponent } from '~/components/defineRecoverableAsyncComponent'
import { trackOp } from '~/services/telemetry'
import { usePublishTopicController } from '../composables/usePublishTopicController'
import ForumPublishTopicLoading from './ForumPublishTopicLoading.vue'

defineOptions({ inheritAttrs: false })

const panel = useTemplateRef<PublishTopicPresentation>('panel')
let reopeningAfterFailure = false
const controller = usePublishTopicController(() => panel.value, (event) => {
  if (event === 'failed')
    reopeningAfterFailure = true
  trackOp(`forum_form_compact_${event}`)
})
const CompactPanel = defineRecoverableAsyncComponent(
  () => import('./ForumCompactPublishTopicPanel.vue'),
  (props: { error?: Error, onRetry?: () => void }) => controller.form.isOpen.value
    ? h(ForumPublishTopicLoading, { ...props, form: controller.form, onClose: () => controller.actions.handleOpenChange(false) })
    : null,
)

watch(controller.form.isOpen, (open) => {
  if (!open)
    return
  if (reopeningAfterFailure) {
    reopeningAfterFailure = false
    return
  }
  trackOp('forum_form_compact_open')
}, { immediate: true })
</script>

<template>
  <CompactPanel ref="panel" v-bind="controller" />
</template>
