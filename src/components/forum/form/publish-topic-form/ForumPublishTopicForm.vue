<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import {
  createReusableTemplate,
  useMediaQuery,
} from '@vueuse/core'
import { last } from 'lodash-es'
import { VisuallyHidden } from 'radix-vue'
import { computed } from 'vue'
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
import {
  FORM_HASH,
  MAX_UPLOAD_FILE_SIZE,
} from './config'

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
} = useFormState()

// Form submission
const {
  submitLoading,
  isCompleted,
  imageList,
  upload,
  handleSubmit: submitForm,
  resetForm,
} = useFormSubmit()

// Template refs
const [UseForm, Form] = createReusableTemplate()
const [UseUploader, Uploader] = createReusableTemplate()

// Combined disabled state
const finalIsDisabled = computed(() =>
  isDisabled.value || submitLoading.value || !isCompleted.value,
)

// Hash checker for form activation
useHashChecker(
  [FORM_HASH, ...tabList.value.map((val: string) => `${FORM_HASH}-${val}`)],
  (hash: string) => {
    if (!userAuth.isTokenValid)
      return true
    const targetTab = last(hash.split('-'))
    const targetType = targetTab && tabList.value.includes(targetTab as ForumAPI.CreateTopicOption['type'])
      ? targetTab as ForumAPI.CreateTopicOption['type']
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
  try {
    await submitForm(formData, () => {
      closeForm()
      initFormData()
      resetForm()
    })
  }
  catch (error) {
    console.error('Form submission failed:', error)
  }
}

function handleClose(): void {
  closeForm()
}
</script>

<template>
  <!-- Image Uploader Template -->
  <UseUploader v-slot="{ fileLimit, size, uploadTips }">
    <ForumImageUpload
      id="upload"
      v-model="imageList"
      :size="size"
      :file-limit="fileLimit"
      :max-file-size="MAX_UPLOAD_FILE_SIZE"
      :auto-upload="true"
      :multiple="true"
      :upload-tips="uploadTips"
      @upload="upload"
    />
  </UseUploader>

  <!-- Form Template -->
  <UseForm>
    <ForumFormTabs
      v-model="formData.type"
      :tabs="formTabs"
      :has-permission="hasPermission"
      :in-transition="inSwitchTabTransition"
    >
      <ForumFormContent
        v-model="formData"
        :tabs="formTabs"
      >
        <template #uploader="{ fileLimit, size }">
          <Uploader
            :file-limit="fileLimit"
            :size="size"
            :upload-tips="message.forum.publish.form.upload.tip"
          />
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

      <Form />

      <ForumFormActions
        :loading="submitLoading"
        :disabled="finalIsDisabled"
        :next-tab="nextTab"
        :in-transition="inSwitchTabTransition"
        :is-desktop="true"
        @submit="handleFormSubmit"
        @switch-tab="switchTab"
        @close="handleClose"
      />
    </DialogScrollContent>
  </Dialog>

  <!-- Mobile Drawer -->
  <Drawer v-else v-model:open="isOpen">
    <DrawerContent>
      <Form class="mt-4" />
      <ForumFormActions
        :loading="submitLoading"
        :disabled="finalIsDisabled"
        :in-transition="inSwitchTabTransition"
        :is-desktop="false"
        @submit="handleFormSubmit"
        @close="handleClose"
      />
    </DrawerContent>
  </Drawer>
</template>

<style lang="scss" src="./ForumPublishTopicForm.scss"></style>
