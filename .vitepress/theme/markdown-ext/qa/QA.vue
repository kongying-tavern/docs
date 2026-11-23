<script setup lang="ts">
import { ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'

import './qa.css'

interface QAProps {
  collapsible?: boolean
  collapsed?: boolean
}

const props = withDefaults(defineProps<QAProps>(), {
  collapsible: true,
  collapsed: false,
})

const { t } = useI18n({ useScope: 'global' })

// An answer that cannot be collapsed stays open, whatever `collapsed` says.
const isOpened = ref<boolean>(!props.collapsible || !props.collapsed)

// Links the toggle button to the answer it hides, so screen readers announce the pair.
const answerId = useId()

function handleToggle() {
  if (!props.collapsible)
    return
  isOpened.value = !isOpened.value
}
</script>

<template>
  <div
    class="qa"
    :class="{
      'qa-collapsible': collapsible,
      'qa-opened': isOpened,
    }"
  >
    <div class="qa-wrapper qa-question">
      <div class="qa-mark qa-mark-question">
        Q
      </div>
      <div class="qa-content">
        <slot name="question" />
      </div>
      <button
        v-if="collapsible"
        type="button"
        class="qa-toggle"
        :aria-expanded="isOpened"
        :aria-controls="answerId"
        @click="handleToggle"
      >
        <span
          class="icon"
          :class="[isOpened ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down']"
        />
        <span class="text">
          {{ isOpened ? t('qa.button.collapse') : t('qa.button.expand') }}
        </span>
      </button>
    </div>
    <div :id="answerId" class="qa-wrapper qa-answer">
      <div class="qa-mark qa-mark-answer">
        A
      </div>
      <div class="qa-content">
        <slot name="answer" />
      </div>
    </div>
  </div>
</template>
