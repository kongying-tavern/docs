<script setup lang="ts">
import { useLocalized } from '@/hooks/useLocalized'

const { message } = useLocalized()
</script>

<template>
  <span
    class="i-lucide-lock-keyhole topic-visibility-icon"
    role="img"
    :aria-label="message.forum.publish.feedbackForm.privateFeedbackVisibility"
    :title="message.forum.publish.feedbackForm.privateFeedbackVisibility"
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
