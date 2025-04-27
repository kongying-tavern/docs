<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { Button } from '@/components/ui/button/'
import { Textarea } from '@/components/ui/textarea/'
import { useSessionStorage } from '@vueuse/core'
import { isEqual } from 'lodash-es'
import { useData, withBase } from 'vitepress'
import { computed } from 'vue'
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
          class="mb-4 mt-2 w-full flex items-center"
        >
          <input
            :id="`feedback-question-checkbox-${index}`" v-model="formData.tags" type="checkbox" :value="item.value"
            class="h-4 w-4 border-gray-300 rounded bg-gray-100 text-color-[var(--vp-c-brand-1)] dark:border-gray-600 dark:bg-[var(--vp-local-search-bg)] focus:color-[var(--vp-c-brand-1)] focus:ring-2 dark:ring-offset-gray-800 dark:focus:ring-green-600"
          >
          <label
            :for="`feedback-question-checkbox-${index}`"
            class="ms-2 text-sm text-color-[var(--vp-c-text-1)] font-medium"
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
        class="mt-4 block w-full border border-gray-300 rounded-lg border-solid bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-[var(--vp-c-bg-alt)] dark:text-white"
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
    <div v-else h-80 w-full flex items-center justify-center>
      <div flex flex-wrap items-center justify-center>
        <span v-if="data?.id" class="feedback-state mr-2 text-color-[var(--vp-c-green-2)]" i-custom-badge-check />
        <span v-if="!data?.id" class="feedback-state mr-2 text-color-[var(--vp-c-red-2)]" i-custom-badge-x />
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

        <a class="mt-1 inline-block w-full text-center vp-link" :href="withBase(`/feedback/topic/${data?.id}`)" target="_blank" rel="noopener noreferrer">
          {{ data?.id ? `Feedback ID: ${data?.id}` : '' }}
        </a>
      </div>
    </div>
  </BlurFade>
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
