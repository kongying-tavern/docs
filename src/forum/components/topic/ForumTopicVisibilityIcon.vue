<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <span
    class="i-lucide-lock-keyhole topic-visibility-icon"
    role="img"
    :aria-label="t('forum.publish.feedbackForm.privateFeedbackVisibility')"
    :title="t('forum.publish.feedbackForm.privateFeedbackVisibility')"
  />
</template>

<style scoped>
.topic-visibility-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  margin-right: 0.25rem;
  vertical-align: -0.125em;
  color: var(--vp-c-text-2);
}
</style>
