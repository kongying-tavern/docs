<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useSessionStorage } from '@vueuse/core'
import { isEqual } from 'lodash-es'
import { useData, withBase } from 'vitepress'
import { computed } from 'vue'
import { Button } from '@/components/ui/button/'
import { Textarea } from '@/components/ui/textarea/'
import { useSubmitTopic } from '~/composables/useSubmitTopic'
import BlurFade from './ui/BlurFade.vue'

const { showForm } = defineProps<{
  showForm: boolean
}>()

const { theme, page } = useData()

const initFormData: ForumAPI.CreateTopicOption = {
  title: 'DOC FEEDBACK',
  text: '',
  tags: [],
  type: 'BUG',
} as const

const formData = useSessionStorage<ForumAPI.CreateTopicOption>(`doc-feedback-form-${page.value.relativePath}`, initFormData, {
  deep: true,
  mergeDefaults: true,
})

const { loading, submitData, data, error } = useSubmitTopic()

const isEditing = computed(() => !isEqual(formData.value, initFormData))

async function submit() {
  await submitData(formData.value)
  if (data.value?.id) {
    formData.value = initFormData
  }
}

function cancel() {
  formData.value = initFormData
}

defineExpose({
  isEditing,
})
</script>

<template>
  <BlurFade v-if="isEditing || showForm" class="slide-enter feedback-question" :duration="0.2" :delay="200">
    <div v-if="loading" class="loader mr-4" />
    <p v-if="loading">
      Loading...
    </p>
    <form v-if="!(data || error)">
      <div class="feedback-title" mt-4>
        <span class="required" />
        {{ theme.docReaction.form.chooseIssues }}
      </div>
      <div class="mb-4 mt-2 flex flex-wrap items-center">
        <div
          v-for="(item, index) in theme.docReaction.form.issueOptions" :key="index"
          class="mb-4 mt-2 flex w-full items-center"
        >
          <input
            :id="`feedback-question-checkbox-${index}`" v-model="formData.tags" type="checkbox" :value="item.value"
            class="text-color-[var(--vp-c-brand-1)] border-gray-300 rounded bg-gray-100 h-4 w-4 focus:color-[var(--vp-c-brand-1)] dark:border-gray-600 dark:bg-[var(--vp-local-search-bg)] focus:ring-2 dark:ring-offset-gray-800 dark:focus:ring-green-600"
          >
          <label
            :for="`feedback-question-checkbox-${index}`"
            class="text-sm text-color-[var(--vp-c-text-1)] font-medium ms-2"
          >{{ item.label }}</label>
        </div>
      </div>

      <div class="feedback-title" mt-4 flex justify-between>
        {{ theme.docReaction.form.feedbackDetail }}
      </div>
      <Textarea
        v-model="formData.text"
        rows="4"
        :placeholder="theme.docReaction.form.feedbackTip"
        maxlength="2000"
        class="text-sm text-gray-900 mt-4 p-2.5 border border-gray-300 rounded-lg border-solid bg-gray-50 w-full block dark:text-white dark:border-gray-600 dark:bg-[var(--vp-c-bg-alt)]"
      />

      <div class="feedback-question-submit" mt-8>
        <Button
          type="button" :disabled="formData.tags.length < 1"
          @click="submit()"
        >
          {{ theme.ui.button.submit }}
        </Button>
        <Button
          variant="secondary"
          type="button"
          ml-4
          @click="cancel()"
        >
          {{ theme.ui.button.cancel }}
        </Button>
      </div>
    </form>
    <div v-else flex h-80 w-full items-center justify-center>
      <div flex flex-wrap items-center justify-center>
        <span v-if="data?.id" class="doc-reaction-feedback-state-success" />
        <span v-if="!data?.id" class="doc-reaction-feedback-state-error" />
        {{
          data?.id
            ? theme.docReaction.feedbackSuccessMsg
            : theme.docReaction.feedbackFailMsg
        }}

        <pre v-if="error" class="mt-4" tabindex="0">
          <code>
            Error Message: {{ error?.message }}
          </code>
        </pre>

        <a class="vp-link mt-1 text-center w-full inline-block" :href="withBase(`/feedback/topic/${data?.id}`)" target="_blank" rel="noopener noreferrer">
          {{ data?.id ? `Feedback ID: ${data?.id}` : '' }}
        </a>
      </div>
    </div>
  </BlurFade>
</template>

<style lang="scss" scoped>
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
