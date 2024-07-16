<template>
  <div
    class="qa"
    :class="{
      'qa-collapsible': collapsible,
      'qa-opened': isOpened,
    }"
  >
    <div class="qa-wrapper qa-summary" @click="handleToggle">
      <div class="qa-mark qa-mark-question">Q</div>
      <div class="qa-content">
        <slot name="summary"></slot>
      </div>
    </div>
    <div class="qa-wrapper qa-detail">
      <div class="qa-mark qa-mark-answer">A</div>
      <div class="qa-content">
        <slot name="detail"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import '../styles/qa.scss'

interface QAProps {
  collapsible?: boolean
}

const props = withDefaults(defineProps<QAProps>(), {
  collapsible: true,
})

const isOpened = ref<boolean>(!props.collapsible)

const handleToggle = () => {
  if (!props.collapsible) return
  isOpened.value = !isOpened.value
}
</script>
