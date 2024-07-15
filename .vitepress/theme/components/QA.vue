<template>
  <details
    class="qa"
    :class="{ 'qa-collapsible': collapsible }"
    :open="!collapsible"
  >
    <summary class="qa-wrapper qa-summary">
      <div class="qa-mark qa-mark-question">Q</div>
      <div class="qa-content">
        <slot name="summary"></slot>
      </div>
    </summary>
    <div class="qa-wrapper qa-detail">
      <div class="qa-mark qa-mark-answer">A</div>
      <div class="qa-content">
        <slot name="detail"></slot>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import '../styles/qa.scss'

interface QAProps {
  collapsible?: boolean
}

const props = withDefaults(defineProps<QAProps>(), {
  collapsible: true,
})
</script>
