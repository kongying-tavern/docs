<script setup lang="ts">
import { useData, useRoute } from 'vitepress'
import { computed, provide, ref, watch } from 'vue'

import { sendDocFeedback } from '../apis/sendDocFeedback'
import { usePageInfoStore } from '../stores/pageinfo'
import DocFeedbackForm from './DocFeedbackForm.vue'

const { theme } = useData()
const router = useRoute()
const pageinfo = usePageInfoStore()

const feedback = ref<'bad' | 'good' | null>(null)
const loading = ref(false)
const feedbackState = ref<boolean | null>(null)

const isGoodFeedback = computed(() => feedback.value === 'good')
const isBadFeedback = computed(() => feedback.value === 'bad')
const feedbackStateClass = computed(() => {
  if (feedbackState.value === true)
    return 'feedback-state text-color-[var(--vp-c-green-2)] i-custom-badge-check w-5 h-5'
  if (feedbackState.value === false)
    return 'feedback-state text-color-[var(--vp-c-red-2)] i-custom-badge-x w-5 h-5'
  return ''
})
const feedbackMessage = computed(() => {
  if (feedbackState.value === null) return theme.value.docsFeedback.feedbackMsg
  if (feedbackState.value) return theme.value.docsFeedback.feedbackSuccessMsg
  if (!feedbackState.value) return theme.value.docsFeedback.feedbackFailMsg
  return ''
})

const additionalMessage = computed(() => {
  if (feedbackState.value === true && feedback.value === 'bad')
    return theme.value.docsFeedback.badFeedbackSuccessMsg
  return ''
})

const setFeedback = (type: 'bad' | 'good') => {
  feedback.value = feedback.value === type ? null : type
}

const sendFeedback = async (isCancel?: boolean) => {
  if (!pageinfo.currentPageinfo.record_id) return (feedbackState.value = false)
  const type = feedback.value
  if (isCancel) feedback.value = null
  loading.value = true // Set loading to true before sending feedback
  const res = await sendDocFeedback(
    pageinfo.currentPageinfo.record_id,
    isCancel ? (type === 'good' ? 'bad' : 'good') : type!,
    isCancel,
  )
  loading.value = false // Set loading to false after feedback response
  if (res.code === 200 && !isCancel) return (feedbackState.value = true)
  if (res.code !== 200) return (feedbackState.value = false)
}

watch(
  () => feedback.value,
  async (newVal) => {
    if (newVal === null) return
    if (feedbackState.value === null && isGoodFeedback.value) pageinfo.addGood()
    if (feedbackState.value === true) {
      if (isBadFeedback.value) pageinfo.removeGood()
      feedbackState.value = null
      await sendFeedback(true)
      return
    }
    await sendFeedback(false)
  },
)

watch(
  () => router.path,
  () => {
    feedback.value = null
    feedbackState.value = null
  },
)

provide('feedback', feedback)
</script>

<template>
  <ClientOnly>
    <div class="feedback">
      <p class="title" flex items-center>
        <span v-if="loading" class="feedback-state loader"></span>
        <span v-if="feedbackState" :class="feedbackStateClass"></span>
        {{ feedbackMessage }}
        <br />
        {{ additionalMessage }}
      </p>
      <div class="feedback-con">
        <span
          :tooltip="theme.docsFeedback.good"
          role="button"
          class="feedback-btn good"
          :class="{ active: isGoodFeedback }"
          @click="setFeedback('good')"
        >
          <i i-custom-thumb />
        </span>
        <span
          :tooltip="theme.docsFeedback.bad"
          role="button"
          class="bad feedback-btn"
          :class="{ active: isBadFeedback }"
          @click="setFeedback('bad')"
        >
          <i i-custom-thumb rotate-180 />
        </span>
      </div>
      <DocFeedbackForm v-if="isBadFeedback" />
    </div>
  </ClientOnly>
</template>

<style lang="scss" scoped>
.feedback {
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 36px;
  margin-top: 24px;
  display: grid;
  grid-row-gap: 8px;
}

.feedback-state {
  display: inline-block;
  fill: currentColor;
  flex-basis: 20px;
  flex-shrink: 0;
  font-size: 18px;
  margin-right: 8px;
}

@media (min-width: 640px) {
  .feedback {
    grid-template-columns: repeat(1, 2fr);
    grid-column-gap: 16px;
  }
}

.loading {
  opacity: 0.7;
}

.title {
  line-height: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.25s;
}

.feedback-con {
  margin-top: 12px;

  .feedback-btn {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    font-size: 20px;
    height: 36px;
    line-height: 36px;
    margin-right: 12px;
    text-align: center;
    width: 60px;
    border-radius: 4px;
    background-color: var(--vp-c-bg-soft);
    transition: all 0.25s ease;

    &.active + & > .loader {
      display: none;
    }

    i {
      width: 22px;
      height: 22px;
      transition: color 0.1s;
    }

    &:hover,
    &.active {
      background: transparent;
      color: var(--vp-c-brand-1);

      &.bad {
        color: var(--vp-c-red-3);
      }
    }
  }
}
</style>
