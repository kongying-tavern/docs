<script setup lang="ts">
import { useData, useRoute } from 'vitepress'
import { inject, onMounted, ref, watch } from 'vue'

import { newDocFeedback } from '../apis/newDocFeedback'

const { theme, page } = useData()

const feedbackContent = ref('')
const checkedItems = ref<string[]>([])
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

  if (res.code == 200) {
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
            :id="`feedback-question-checkbox-${index}`"
            v-model="checkedItems"
            type="checkbox"
            :value="item.value"
            class="bg-gray-100 border-gray-300 dark:bg-[var(--vp-local-search-bg)] dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:color-[var(--vp-c-brand-1)] focus:ring-2 h-4 rounded text-color-[var(--vp-c-brand-1)] w-4"
          />
          <label
            :for="`feedback-question-checkbox-${index}`"
            class="font-medium ms-2 text-color-[var(--vp-c-text-1)] text-sm"
            >{{ item.label }}</label
          >
        </div>
      </div>
      <div class="feedback-title" flex justify-between mt-4>
        {{ theme.docsFeedback.form.feedbackDetail }}
        <span op-50 font-size-3>{{ feedbackContent.length }}/2000</span>
      </div>
      <textarea
        v-model.trim="feedbackContent"
        rows="4"
        :placeholder="theme.docsFeedback.form.feedbackTip"
        maxlength="2000"
        class="bg-gray-50 block border border-gray-300 dark:bg-[var(--vp-c-bg-alt)] dark:border-gray-600 dark:focus:border-blue-500 dark:focus:ring-blue-500 dark:placeholder-gray-400 dark:text-white focus:border-blue-500 focus:ring-blue-500 mt-4 p-2.5 rounded-lg text-gray-900 text-sm w-full"
      ></textarea>
      <div mt-4>
        <label
          for="contract_way"
          class="block dark:text-white flex font-medium justify-between mb-2 text-gray-900 text-sm"
          >{{ theme.docsFeedback.form.contactWay }}
          <span op-50 font-size-3>{{ contractWay.length }}/50</span>
        </label>
        <input
          id="contract_way"
          v-model.trim="contractWay"
          type="text"
          maxlength="50"
          class="bg-gray-50 block border border-gray-300 dark:bg-[var(--vp-c-bg-alt)] dark:border-gray-600 dark:focus:border-blue-500 dark:focus:ring-blue-500 dark:placeholder-gray-400 dark:text-white focus:border-blue-500 focus:ring-blue-500 p-2.5 rounded-lg text-gray-900 text-sm w-full"
          placeholder="Phone/E-Mail/QQ/WeChat/Discord"
        />
      </div>
      <div class="feedback-question-submit" mt-8>
        <button
          type="button"
          :disabled="checkedItems.length < 1"
          class="bg-[var(--vp-c-brand)] border-[var(--vp-button-brand-border)] color-white dark:bg-[var(--vp-button-brand-bg)] focus:outline-none font-medium hover:bg-[var(--vp-c-brand)] hover:border-[var(--vp-button-brand-border)] px-4 py-2 rounded-lg text-center text-sm"
          @click="submit()"
        >
          {{ theme.ui.button.submit }}
        </button>
        <button
          type="button"
          class="bg-[var(--vp-button-alt-bg)] border border-[var(--vp-button-alt-border)] font-medium hover:bg-[var(--vp-button-alt-hover-bg)] hover:border-[var(--vp-button-alt-hover-border)] ml-4 px-4 py-2 rounded-lg text-center text-sm"
          @click="feedback = null"
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
          class="feedback-state mr-2 text-color-[var(--vp-c-green-2)]"
          i-custom-badge-check
        ></span>
        <span
          v-if="!feedbackID"
          class="feedback-state mr-2 text-color-[var(--vp-c-red-2)]"
          i-custom-badge-x
        ></span>
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
