<script setup lang="ts">
import { ref, onMounted, watch, defineProps, inject } from 'vue'
import { useData, useRoute } from 'vitepress'

import { newDocFeedback } from '../apis/newDocFeedback'

const { theme, page } = useData()

const feedbackContent = ref('')
const checkedItems = ref<Array<string>>([])
const contractWay = ref('')
const loading = ref(false)
const feedback = inject('feedback')
const feedbackID = ref('')
const hideForm = ref(false)

const submit = async () => {
  loading.value = true
  hideForm.value = true

  const res = await newDocFeedback({
    path: page.value.filePath,
    feedback_content: feedbackContent.value,
    feedback_type: checkedItems.value,
    user_contact: contractWay.value,
  })

  if (res?.code == 200) {
    feedbackID.value = res.data?.feedback_id!
  }
  loading.value = false
}
</script>

<template>
  <div class="feedback-question slide-enter">
    <form v-if="!hideForm">
      <div class="feedback-title" mt-4>
        {{ theme.docsFeedback.form.chooseIssues }}
        <span class="feedback-question-title_required" color-red>*</span> :
      </div>
      <div class="flex flex-wrap items-center mb-4 mt-2">
        <div
          v-for="(item, index) in theme.docsFeedback.form.issueOptions"
          :key="index"
          class="flex items-center mb-4 mt-2 w-full"
        >
          <input
            :id="'feedback-question-checkbox-' + index"
            type="checkbox"
            :value="item.value"
            v-model="checkedItems"
            class="w-4 h-4 text-color-[var(--vp-c-brand-1)] bg-gray-100 border-gray-300 rounded focus:color-[var(--vp-c-brand-1)] dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label
            :for="'feedback-question-checkbox-' + index"
            class="ms-2 text-sm font-medium text-color-[var(--vp-c-text-1)]"
            >{{ item.label }}</label
          >
        </div>
      </div>
      <div class="feedback-title" mt-4>
        {{ theme.docsFeedback.form.feedbackDetail }}
      </div>
      <textarea
        v-model.trim="feedbackContent"
        rows="4"
        :placeholder="theme.docsFeedback.form.feedbackTip"
        maxlength="2000"
        class="mt-4 block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      ></textarea>
      <div mt-4>
        <label
          for="contract_way"
          class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >{{ theme.docsFeedback.form.contactWay }}</label
        >
        <input
          type="text"
          id="contract_way"
          v-model.trim="contractWay"
          maxlength="50"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Phone/E-Mail/QQ/WeChat/Discord"
        />
      </div>
      <div class="feedback-question-submit" mt-8>
        <button
          type="button"
          @click="submit()"
          :disabled="checkedItems.length < 1"
          class="px-4 py-2 text-sm font-medium text-center rounded-lg focus:outline-none bg-[var(--vp-c-brand)] border-[var(--vp-button-brand-border)] hover:bg-[var(--vp-c-brand)] hover:border-[var(--vp-button-brand-border)] color-white"
        >
          {{ theme.ui.button.submit }}
        </button>
        <button
          type="button"
          @click="feedback = null"
          class="ml-4 px-4 py-2 text-sm font-medium text-center rounded-lg border bg-[var(--vp-button-alt-bg)] border-[var(--vp-button-alt-border)] hover:bg-[var(--vp-button-alt-hover-bg)] hover:border-[var(--vp-button-alt-hover-border)]"
        >
          {{ theme.ui.button.cancel }}
        </button>
      </div>
    </form>
    <div v-else flex items-center justify-center w-full h-80>
      <div v-if="loading" class="loader mr-4"></div>
      <p v-if="loading">Loading...</p>
      <div v-else flex justify-center items-center flex-wrap>
        <span
          v-if="feedbackID"
          class="feedback-state text-color-[var(--vp-c-green-2)] mr-2"
          i-custom-badge-check
        ></span>
        <span
          v-if="!feedbackID"
          class="feedback-state text-color-[var(--vp-c-red-2)] mr-2"
          i-custom-badge-x
        ></span>
        {{
          feedbackID
            ? theme.docsFeedback.feedbackSuccessMsg
            : theme.docsFeedback.feedbackFailMsg
        }}
        <p inline-block text-center style="width: 100%">
          {{ feedbackID ? 'Feedback ID: ' + feedbackID : '' }}
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
    background-color: #bbbfc4;
    cursor: not-allowed;
  }
}
</style>
