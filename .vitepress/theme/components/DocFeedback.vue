<script setup lang="ts">
import { useReactionStore } from '@/stores/useReaction'
import { useData } from 'vitepress'
import { computed, useTemplateRef } from 'vue'
import DocFeedbackForm from './DocFeedbackForm.vue'

const { theme, frontmatter } = useData()
const reaction = useReactionStore()
const feedbackForm = useTemplateRef('feedbackForm')

const feedbackStateClass = computed(() => {
  if (!reaction.setReactionResponse)
    return 'hide'
  if (reaction.setReactionResponse?.statusCode !== 200 || feedbackForm.value?.isEditing)
    return 'feedback-state text-color-[var(--vp-c-red-2)] i-custom-badge-x w-5 h-5'
  if (reaction.setReactionResponse?.statusCode === 200 || feedbackForm.value?.isEditing)
    return 'feedback-state text-color-[var(--vp-c-green-2)] i-custom-badge-check w-5 h-5'
  return 'hide'
})

const feedbackMessage = computed(() => {
  if (feedbackForm.value?.isEditing)
    return theme.value.docsFeedback.feedbackSuccessMsg
  if (!reaction.setReactionResponse)
    return theme.value.docsFeedback.feedbackMsg
  if (reaction.setReactionResponse?.statusCode !== 200)
    return theme.value.docsFeedback.feedbackFailMsg
  return theme.value.docsFeedback.feedbackSuccessMsg
})

const additionalMessage = computed(() => {
  if ((feedbackForm.value?.isEditing || reaction.setReactionResponse?.statusCode === 200) && reaction.reactionState === 'dislike')
    return theme.value.docsFeedback.badFeedbackSuccessMsg
  return ''
})
</script>

<template>
  <ClientOnly>
    <div v-if="frontmatter.docInfo !== false" id="doc-feedback" class="feedback">
      <p class="title" flex items-center>
        <span v-if="reaction.reactionSubmitLoading" class="feedback-state loader" />
        <span :class="feedbackStateClass" />
        {{ feedbackMessage }}
        <br>
        {{ additionalMessage }}
        {{ reaction.error?.message }}
      </p>
      <div class="feedback-con">
        <span
          :tooltip="theme.docsFeedback.good"
          role="button"
          class="feedback-btn good"
          :class="{ active: reaction.reactionState === 'like' }"
          @click="reaction.setReactionState('like')"
        >
          <i i-custom-thumb />
        </span>
        <span
          :tooltip="theme.docsFeedback.bad"
          role="button"
          class="feedback-btn bad"
          :class="{ active: reaction.reactionState === 'dislike' }"
          @click="reaction.setReactionState('dislike')"
        >
          <i i-custom-thumb rotate-180 />
        </span>
      </div>
      <DocFeedbackForm ref="feedbackForm" :show-form="reaction.reactionState === 'dislike' && reaction.setReactionResponse?.statusCode === 200" />
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
