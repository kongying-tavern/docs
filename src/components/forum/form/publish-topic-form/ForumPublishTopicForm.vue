<script setup lang="ts">
import type { TopicFormData } from '../../utils/validation'
import {
  createReusableTemplate,
  useMediaQuery,
} from '@vueuse/core'
import { last } from 'lodash-es'
import { VisuallyHidden } from 'radix-vue'
import { computed } from 'vue'
import { toast } from 'vue-sonner'
import {
  Dialog,
  DialogScrollContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer'
import { useHashChecker } from '@/hooks/useHashChecker'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'
import ForumImageUpload from '~/components/forum/form/ForumImageUpload.vue'
import { useFormState } from '../composables/useFormState'
import { useFormSubmit } from '../composables/useFormSubmit'
import ForumFormActions from '../ForumFormActions.vue'
import ForumFormContent from '../ForumFormContent.vue'
import ForumFormTabs from '../ForumFormTabs.vue'
import { FORM_HASH } from './config'

// Composables
const userAuth = useUserAuthStore()
const { message } = useLocalized()
const isDesktop = useMediaQuery('(min-width: 768px)')

// Form state management
const {
  isOpen,
  inSwitchTabTransition,
  formData,
  formTabs,
  tabList,
  nextTab,
  isDisabled,
  hasPermission,
  switchTab,
  initFormData,
  setFormType,
  closeForm,
  validate,
} = useFormState()

// Form submission
const {
  submitLoading,
  addFiles,
  attachments,
  canSelect,
  isBusy,
  remove,
  retry,
  handleSubmit: submitForm,
  reset,
} = useFormSubmit()

// Template refs
const [UseForm, Form] = createReusableTemplate()
const [UseUploader, Uploader] = createReusableTemplate()

// Combined disabled state
const finalIsDisabled = computed(() =>
  isDisabled.value || submitLoading.value || isBusy.value,
)
const imageSelectionDisabled = computed(() => submitLoading.value || isBusy.value || !canSelect.value)

// Hash checker for form activation
useHashChecker(
  [FORM_HASH, ...tabList.value.map((val: string) => `${FORM_HASH}-${val}`)],
  (hash: string) => {
    if (!userAuth.isTokenValid)
      return true
    const targetTab = last(hash.split('-'))
    const targetType = targetTab && tabList.value.includes(targetTab as TopicFormData['type'])
      ? targetTab as TopicFormData['type']
      : undefined

    if (targetType) {
      setFormType(targetType)
    }
    isOpen.value = true
  },
  {
    redirectHash: 'login-alert',
  },
)

// Event handlers
async function handleFormSubmit(): Promise<void> {
  const validation = await validate()
  if (!validation.valid)
    return

  const result = await submitForm(
    formData.value,
    hasPermission.value,
    () => {
      closeForm()
      initFormData()
      reset()
    },
  )
  if (!result.ok && result.stage !== 'topic')
    toast.error(result.error.message)
}

async function handleFilesSelected(files: File[]): Promise<void> {
  const result = await addFiles(files)
  if (!result.ok) {
    for (const error of result.errors)
      toast.error(error.message)
  }
}

async function handleRetry(id: string): Promise<void> {
  const result = await retry(id)
  if (!result.ok) {
    for (const error of result.errors)
      toast.error(error.message)
  }
}

function handleClose(): void {
  closeForm()
}
</script>

<template>
  <!-- Image Uploader Template -->
  <UseUploader v-slot="{ size }">
    <ForumImageUpload
      :attachments="attachments"
      :disabled="imageSelectionDisabled"
      :size="size"
      @files-selected="handleFilesSelected"
      @remove="remove"
      @retry="handleRetry"
    />
  </UseUploader>

  <!-- Form Template -->
  <UseForm>
    <ForumFormTabs
      :model-value="formData.type"
      :tabs="formTabs"
      :has-permission="hasPermission"
      :in-transition="inSwitchTabTransition"
      @update:model-value="setFormType"
    >
      <ForumFormContent :tabs="formTabs" @files-selected="handleFilesSelected">
        <template #uploader="{ size }">
          <Uploader :size="size" />
        </template>
      </ForumFormContent>
    </ForumFormTabs>
  </UseForm>

  <!-- Desktop Dialog -->
  <Dialog v-if="isDesktop" v-model:open="isOpen">
    <DialogScrollContent
      class="form-container paper mx-auto mb-70px mt-110px flex flex-col h-fit max-h-[1200px] min-h-100vh min-w-800px shadow-[var(--vp-shadow-3)] before:pos-absolute"
      :hide-default-close-button="true"
      :class="{ 'animate-switching': inSwitchTabTransition }"
    >
      <VisuallyHidden>
        <DialogTitle>
          {{ message.forum.publish.title }}
        </DialogTitle>
      </VisuallyHidden>

      <form @submit.prevent="handleFormSubmit">
        <Form />

        <ForumFormActions
          :loading="submitLoading"
          :disabled="finalIsDisabled"
          :next-tab="nextTab"
          :in-transition="inSwitchTabTransition"
          @switch-tab="switchTab"
          @close="handleClose"
        />
      </form>
    </DialogScrollContent>
  </Dialog>

  <!-- Mobile Drawer -->
  <Drawer v-else v-model:open="isOpen">
    <DrawerContent>
      <form @submit.prevent="handleFormSubmit">
        <Form class="mt-4" />
        <ForumFormActions
          :loading="submitLoading"
          :disabled="finalIsDisabled"
          :in-transition="inSwitchTabTransition"
          @close="handleClose"
        />
      </form>
    </DrawerContent>
  </Drawer>
</template>

<style lang="scss" src="./ForumPublishTopicForm.scss"></style>
