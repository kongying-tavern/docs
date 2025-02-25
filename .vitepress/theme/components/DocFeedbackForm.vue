<script setup lang="ts">
import { useData } from 'vitepress'
import { inject, ref } from 'vue'

import { newDocFeedback } from '../apis/feedback/newDocFeedback'

const { theme, page } = useData()

const feedbackContent = ref('')
const checkedItems = ref<string[]>([])
const contractWay = ref('')
const loading = ref(false)
const feedback = inject('feedback')
const feedbackID = ref('')
const hideForm = ref(false)

async function submit() {
  loading.value = true
  hideForm.value = true

  const res = await newDocFeedback({
    path: page.value.filePath,
    feedback_content: feedbackContent.value,
    feedback_type: checkedItems.value,
    user_contact: contractWay.value,
  })

  if (res.code === 200) {
    feedbackID.value = res.data?.feedback_id ?? ''
  }
  loading.value = false
}
</script>

<template>
  <div class="slide-enter feedback-question">
    <form v-if="!hideForm">
      <div class="feedback-title" mt-4>
        {{ theme.docsFeedback.form.chooseIssues }}
        <span class="feedback-question-title_required" color-red>*</span> :
      </div>
      <div class="mb-4 mt-2 flex flex-wrap items-center">
        <div
          v-for="(item, index) in theme.docsFeedback.form.issueOptions"
          :key="index"
          class="mb-4 mt-2 w-full flex items-center"
        >
          <input
            :id="`feedback-question-checkbox-${index}`"
            v-model="checkedItems"
            type="checkbox"
            :value="item.value"
            class="h-4 w-4 border-gray-300 rounded bg-gray-100 text-color-[var(--vp-c-brand-1)] dark:border-gray-600 dark:bg-[var(--vp-local-search-bg)] focus:color-[var(--vp-c-brand-1)] focus:ring-2 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
          >
          <label
            :for="`feedback-question-checkbox-${index}`"
            class="ms-2 text-sm text-color-[var(--vp-c-text-1)] font-medium"
          >{{ item.label }}</label>
        </div>
      </div>
      <div class="feedback-title" mt-4 flex justify-between>
        {{ theme.docsFeedback.form.feedbackDetail }}
        <span font-size-3 op-50>{{ feedbackContent.length }}/2000</span>
      </div>
      <textarea
        v-model.trim="feedbackContent"
        rows="4"
        :placeholder="theme.docsFeedback.form.feedbackTip"
        maxlength="2000"
        class="mt-4 block w-full border border-gray-300 rounded-lg bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 focus:border-blue-500 dark:bg-[var(--vp-c-bg-alt)] dark:text-white focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 dark:placeholder-gray-400"
      />
      <div mt-4>
        <label
          for="contract_way"
          class="mb-2 block flex justify-between text-sm text-gray-900 font-medium dark:text-white"
        >{{ theme.docsFeedback.form.contactWay }}
          <span font-size-3 op-50>{{ contractWay.length }}/50</span>
        </label>
        <input
          id="contract_way"
          v-model.trim="contractWay"
          type="text"
          maxlength="50"
          class="block w-full border border-gray-300 rounded-lg bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 focus:border-blue-500 dark:bg-[var(--vp-c-bg-alt)] dark:text-white focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500 dark:placeholder-gray-400"
          placeholder="Phone/E-Mail/QQ/WeChat/Discord"
        >
      </div>
      <div class="feedback-question-submit" mt-8>
        <button
          type="button"
          :disabled="checkedItems.length < 1"
          class="border-[var(--vp-button-brand-border)] rounded-lg bg-[var(--vp-c-brand)] px-4 py-2 text-center text-sm color-white font-medium hover:border-[var(--vp-button-brand-border)] dark:bg-[var(--vp-button-brand-bg)] hover:bg-[var(--vp-c-brand)] focus:outline-none"
          @click="submit()"
        >
          {{ theme.ui.button.submit }}
        </button>
        <button
          type="button"
          class="ml-4 border border-[var(--vp-button-alt-border)] rounded-lg bg-[var(--vp-button-alt-bg)] px-4 py-2 text-center text-sm font-medium hover:border-[var(--vp-button-alt-hover-border)] hover:bg-[var(--vp-button-alt-hover-bg)]"
          @click="feedback = null"
        >
          {{ theme.ui.button.cancel }}
        </button>
      </div>
    </form>
    <div v-else h-80 w-full flex items-center justify-center>
      <div v-if="loading" class="loader mr-4" />
      <p v-if="loading">
        Loading...
      </p>
      <div v-else flex flex-wrap items-center justify-center>
        <span
          v-if="feedbackID"
          class="feedback-state mr-2 text-color-[var(--vp-c-green-2)]"
          i-custom-badge-check
        />
        <span
          v-if="!feedbackID"
          class="feedback-state mr-2 text-color-[var(--vp-c-red-2)]"
          i-custom-badge-x
        />
        {{
          feedbackID
            ? theme.docsFeedback.feedbackSuccessMsg
            : theme.docsFeedback.feedbackFailMsg
        }}
        <p inline-block text-center style="width: 100%">
          {{ feedbackID ? `Feedback ID: ${feedbackID}` : '' }}
        </p>
      </div>
    </div>
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

.feedback-question-submit {
  button {
    transition:
      color 0.25s,
      border-color 0.25s,
      background-color 0.25s;
  }

  button[disabled] {
    opacity: 0.8;
    cursor: not-allowed;
  }
}
</style>
