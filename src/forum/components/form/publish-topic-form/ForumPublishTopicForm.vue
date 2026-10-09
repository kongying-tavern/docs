<script setup lang="ts">
import type { FeedbackFormVariant } from '~/forum/services/form/feedbackFormExperiment'
import { defineAsyncComponent, ref, useTemplateRef, watch } from 'vue'
import { useFeedbackFormExperiment } from '~/forum/composables/state/useFeedbackFormExperiment'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'
import { trackOp } from '~/services/telemetry'
import { usePublishTopicController } from '../composables/usePublishTopicController'
import ForumPublishTopicPanel from './ForumPublishTopicPanel.vue'

const CompactPanel = defineAsyncComponent(() => import('./ForumCompactPublishTopicPanel.vue'))
const panel = useTemplateRef<InstanceType<typeof ForumPublishTopicPanel>>('panel')
const userInfo = useUserInfoStore()
const experiment = useFeedbackFormExperiment()
const variant = ref<FeedbackFormVariant>(experiment.variant.value)
const ready = ref(false)
// 面板就绪前读实时分配，之后读冻结值，避免打开过程中换皮
const currentVariant = () => ready.value ? variant.value : experiment.variant.value
let reopeningAfterFailure = false
const controller = usePublishTopicController(() => panel.value, (event) => {
  if (event === 'failed')
    reopeningAfterFailure = true
  trackOp(`forum_form_${variant.value}_${event}`)
}, currentVariant)
watch([experiment.variant, controller.form.isOpen, controller.submission.submitLoading], ([assigned, open, submitting]) => {
  if (!open && !submitting)
    variant.value = assigned
}, { flush: 'sync' })
// Freeze the presentation while open and during submission, including failed retries.
watch(controller.form.isOpen, async (open) => {
  if (!open)
    return
  if (reopeningAfterFailure) {
    reopeningAfterFailure = false
    return
  }
  if (!userInfo.info) {
    try {
      await userInfo.refreshUserInfo()
    }
    catch {
      // The legacy form remains usable when account information cannot load.
    }
  }
  if (!controller.form.isOpen.value)
    return
  variant.value = experiment.variant.value
  controller.actions.initializeEntryPage()
  ready.value = true
  trackOp(`forum_form_${variant.value}_open`)
}, { immediate: true })
</script>

<template>
  <component :is="variant === 'compact' ? CompactPanel : ForumPublishTopicPanel" v-if="ready" ref="panel" v-bind="controller" />
</template>
