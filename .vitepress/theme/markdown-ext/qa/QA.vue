<script setup lang="ts">
import { ref, toRef, useId } from 'vue'

import { useI18n } from 'vue-i18n'
import { useQaGroupControl } from './useQaGroupControl.ts'

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

// Naming the button after its own question keeps a page of QAs apart when a
// screen reader lists the buttons; the visible label stays part of the name.
const questionId = useId()
const toggleTextId = useId()
const toggleLabel = `${questionId} ${toggleTextId}`

// The only way the state changes, for the toggle and for the group alike; an
// answer that has no toggle refuses both, so the two can never disagree.
function setOpened(opened: boolean) {
  if (!props.collapsible)
    return
  isOpened.value = opened
}

function handleToggle() {
  setOpened(!isOpened.value)
}

// A QA outside a group joins nothing and simply stays on its own.
useQaGroupControl({
  collapsible: toRef(props, 'collapsible'),
  isOpened,
  setOpened,
})
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
      <div :id="questionId" class="qa-content">
        <slot name="question" />
      </div>
      <button
        v-if="collapsible"
        type="button"
        class="qa-toggle"
        :aria-expanded="isOpened"
        :aria-controls="answerId"
        :aria-labelledby="toggleLabel"
        @click="handleToggle"
      >
        <span
          class="icon"
          :class="[isOpened ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down']"
        />
        <span :id="toggleTextId" class="text">
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
