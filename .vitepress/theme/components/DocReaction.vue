<script setup lang="ts">
import { useReactionStore } from '@/stores/useReaction'
import { useData } from 'vitepress'
import { computed, useTemplateRef } from 'vue'
import DocFeedbackForm from './DocReactionForm.vue'

const { variant = 'default', showForm = true } = defineProps<{
  variant?: 'default' | 'card'
  showForm?: boolean
}>()

const { theme } = useData()
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
    return theme.value.docReaction.feedbackSuccessMsg
  if (!reaction.setReactionResponse)
    return theme.value.docReaction.feedbackMsg
  if (reaction.setReactionResponse?.statusCode !== 200)
    return theme.value.docReaction.feedbackFailMsg
  return theme.value.docReaction.feedbackSuccessMsg
})

const additionalMessage = computed(() => {
  if ((feedbackForm.value?.isEditing || reaction.setReactionResponse?.statusCode === 200) && reaction.reactionState === 'dislike')
    return theme.value.docReaction.badFeedbackSuccessMsg
  return ''
})

// @unocss-include
const styles = computed(() => {
  if (variant === 'card') {
    return {
      container: 'bg-[var(--vp-c-bg-soft)] text-xs px-4 py-2 rounded-lg flex items-center justify-between',
      message: 'text-xs',
      button: 'h-7 w-5 pt-0.5 hover:text-black dark:hover:text-white not-first:ml-2',
      buttonContainer: 'flex items-center justify-between',
    }
  }
  return {
    container: 'border-t border-[var(--vp-c-divider)] border-t pt-36px mt-24px grid gap-row-8px',
    message: 'inline-block fill-current-color flex-basis-20px flex-shrink-0 font-size-1rem mr-2 font-[var(--vp-font-family-subtitle)]',
    buttonContainer: 'flex mt-3',
    button: 'font-size-20px h-36px line-height-36px mr-12px text-center w-60px rounded-4px bg-[var(--vp-c-bg-soft)]',
  }
})
</script>

<template>
  <div id="doc-feedback" class="feedback" :class="styles.container">
    <p flex items-center :class="styles.message">
      <span v-if="reaction.reactionSubmitLoading" class="loader feedback-state" />
      <span :class="feedbackStateClass" />
      {{ feedbackMessage }}

      <template v-if="variant === 'card' && reaction.error?.message">
        ({{ reaction.error?.message }} )
      </template>

      <br>

      <template v-if="variant !== 'card'">
        {{ additionalMessage }}
        {{ reaction.error?.message }}
      </template>
    </p>
    <div class="feedback-con" :class="styles.buttonContainer">
      <span
        :tooltip="theme.docReaction.good"
        role="button"
        class="feedback-btn good"
        :class="{ active: reaction.reactionState === 'like', [styles.button]: true }"
        @click="reaction.setReactionState('like')"
      >
        <i i-custom-thumb />
      </span>
      <span
        :tooltip="theme.docReaction.bad"
        role="button"
        class="feedback-btn bad"
        :class="{ active: reaction.reactionState === 'dislike', [styles.button]: true }"
        @click="reaction.setReactionState('dislike')"
      >
        <i i-custom-thumb rotate-180 />
      </span>
    </div>
    <DocFeedbackForm v-if="variant === 'default' && showForm" ref="feedbackForm" :show-form="reaction.reactionState === 'dislike' && reaction.setReactionResponse?.statusCode === 200" />
  </div>
</template>

<style lang="scss" scoped>
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
  .feedback-btn {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.1s ease;

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
