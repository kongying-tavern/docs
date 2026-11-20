<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import '../styles/qa.css'

interface QAProps {
  collapsible?: boolean
}

const props = withDefaults(defineProps<QAProps>(), {
  collapsible: true,
})

const { t } = useI18n({ useScope: 'global' })

const isOpened = ref<boolean>(!props.collapsible)

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
    <div class="qa-wrapper qa-summary" @click="handleToggle">
      <div class="qa-mark qa-mark-question">
        Q
      </div>
      <div class="qa-content">
        <slot name="summary" />
      </div>
      <div v-if="collapsible" class="qa-toggle">
        <span
          class="icon"
          :class="[isOpened ? 'i-mdi-chevron-up' : 'i-mdi-chevron-down']"
        />
        <span class="text">
          {{ isOpened ? t('qa.button.collapse') : t('qa.button.expand') }}
        </span>
      </div>
    </div>
    <div class="qa-wrapper qa-detail">
      <div class="qa-mark qa-mark-answer">
        A
      </div>
      <div class="qa-content">
        <slot name="detail" />
      </div>
    </div>
  </div>
</template>
