<script setup lang="ts">
import type { PublishTopicController, PublishTopicPresentation } from '../composables/usePublishTopicController'
import { OctagonXIcon, XIcon } from '@lucide/vue'
import { createReusableTemplate, useMediaQuery } from '@vueuse/core'
import { nextTick, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogDescription, DialogScrollContent, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { useLocalized } from '@/hooks/useLocalized'
import { useSitePreferences } from '~/composables/useSitePreferences'
import ForumImageUpload from '~/forum/components/form/ForumImageUpload.vue'
import ForumQuotedTopicCard from '~/forum/components/topic/ForumQuotedTopicCard.vue'
import { IMAGE_UPLOAD_POLICY } from '~/forum/services/forumConfig'
import ForumFormActionBar from '../ForumFormActionBar.vue'
import ForumFormActions from '../ForumFormActions.vue'
import ForumFormContent from '../ForumFormContent.vue'
import ForumFormTabs from '../ForumFormTabs.vue'

import ForumPublishTopicStage from './ForumPublishTopicStage.vue'

const props = defineProps<{ form: PublishTopicController['form'], upload: PublishTopicController['upload'], submission: PublishTopicController['submission'], actions: PublishTopicController['actions'] }>()
const { isOpen, formData, formTabs, nextTab, hasPermission, username, quotedTopicData, quotedTopicQuery } = props.form
const { attachments, imageSelectionDisabled, remove, handleFilesSelected, handleRetry } = props.upload
const { submitLoading, submissionPhase, submissionAlert, validationErrorCount, finalIsDisabled } = props.submission
const { handleFormSubmit, handleClose, handleOpenChange, setFormType, switchTab, focusFirstInvalid } = props.actions
const { message } = useLocalized()
const { reducedMotion } = useSitePreferences()
const isDesktop = useMediaQuery('(min-width: 768px)')
const [UseForm, Form] = createReusableTemplate()
const [UseUploader, Uploader] = createReusableTemplate()
const formElement = useTemplateRef<HTMLFormElement>('formElement')
const imageUpload = useTemplateRef<InstanceType<typeof ForumImageUpload>>('imageUpload')
const inSwitchTabTransition = ref(false)
const sendMotionActive = ref(false)
const pendingMotion = new Set<() => void>()

async function waitForMotion(name: string): Promise<void> {
  await nextTick()
  if (reducedMotion.value)
    return
  const animations = formElement.value?.getAnimations({ subtree: true })
    .filter(animation => animation instanceof CSSAnimation && animation.animationName === name) ?? []
  if (!animations.length)
    return
  await new Promise<void>((resolve) => {
    const finish = () => {
      pendingMotion.delete(finish)
      resolve()
    }
    pendingMotion.add(finish)
    void Promise.allSettled(animations.map(animation => animation.finished)).then(finish)
  })
}

onBeforeUnmount(() => {
  for (const finish of pendingMotion)
    finish()
})

async function animateSwitchTab(): Promise<void> {
  if (inSwitchTabTransition.value)
    return
  switchTab()
  inSwitchTabTransition.value = true
  await waitForMotion('forum-form-switch')
  inSwitchTabTransition.value = false
}

function focusElement(target: HTMLElement | null | undefined): void {
  target?.focus({ preventScroll: true })
  target?.scrollIntoView({ behavior: reducedMotion.value ? 'auto' : 'smooth', block: 'center' })
}

const presentation: PublishTopicPresentation = {
  async focusValidation(field) {
    await nextTick()
    const id = field === 'text' ? 'content' : field
    if (id)
      focusElement(formElement.value?.querySelector<HTMLElement>(`#${CSS.escape(id)}`))
  },
  async settleSend() {
    sendMotionActive.value = true
    try {
      await waitForMotion('forum-letter-send')
    }
    finally {
      sendMotionActive.value = false
    }
  },
  async focusUploadFailure() {
    await nextTick()
    focusElement(formElement.value?.querySelector<HTMLElement>('[data-status="failed"] button'))
  },
}
defineExpose(presentation)
</script>

<template>
  <UseUploader v-slot="{ size }">
    <ForumImageUpload
      ref="imageUpload"
      :attachments="attachments"
      :disabled="imageSelectionDisabled"
      :hide-default-trigger="!isDesktop"
      :class="{ hidden: !isDesktop && attachments.length === 0 }"
      :size="size"
      @files-selected="handleFilesSelected"
      @remove="remove"
      @retry="handleRetry"
      @paste.stop
    />
  </UseUploader>

  <UseForm>
    <ForumFormTabs
      :model-value="formData.type"
      :tabs="formTabs"
      :has-permission="hasPermission"
      :username="username"
      :loading="submitLoading"
      @update:model-value="setFormType"
    >
      <Alert v-if="submissionAlert" variant="destructive" class="mx-5 mb-3 pr-9 shrink-0 w-auto md:mx-4">
        <OctagonXIcon />
        <AlertTitle>{{ submissionAlert.title }}</AlertTitle>
        <AlertDescription class="whitespace-pre-wrap break-words">
          {{ submissionAlert.description }}
        </AlertDescription>
        <button
          type="button"
          class="color-[var(--vp-c-text-2)] icon-btn right-1.5 top-1.5 absolute hover:color-[var(--vp-c-text-1)]"
          :aria-label="message.ui.button.close"
          @click="submissionAlert = null"
        >
          <XIcon class="size-3.5" />
        </button>
      </Alert>
      <ForumFormContent
        :tabs="formTabs"
        :image-selection-disabled="imageSelectionDisabled || attachments.length >= IMAGE_UPLOAD_POLICY.MAX_COUNT"
        @files-selected="handleFilesSelected"
        @select-images="imageUpload?.open()"
      >
        <template #uploader="{ size }">
          <Uploader :size="size" />
        </template>
        <template #after-content>
          <ForumQuotedTopicCard
            v-if="formData.quotedTopic"
            class="mt-3 w-full"
            :reference="formData.quotedTopic"
            :topic="quotedTopicData"
            :loading="quotedTopicQuery.isLoading.value || (!quotedTopicData && !quotedTopicQuery.error.value)"
            :unavailable="Boolean(quotedTopicQuery.error.value)"
            :interactive="false"
            @retry="quotedTopicQuery.refetch()"
          />
        </template>
      </ForumFormContent>
    </ForumFormTabs>
  </UseForm>

  <Dialog v-if="isDesktop" :open="isOpen" @update:open="handleOpenChange">
    <DialogScrollContent
      class="form-container paper mx-auto p-0 flex flex-col max-w-none w-[min(800px,calc(100vw-32px))] shadow-[var(--vp-shadow-3)] overflow-visible before:pos-absolute"
      :hide-default-close-button="true"
      :data-phase="sendMotionActive ? 'closing' : submissionPhase"
      :class="{ 'animate-switching': inSwitchTabTransition }"
    >
      <DialogTitle class="sr-only">
        {{ message.forum.publish.title }}
      </DialogTitle>
      <DialogDescription class="sr-only">
        {{ message.forum.publish.form.content.placeholder }}
      </DialogDescription>

      <ForumPublishTopicStage :form="form" :actions="actions">
        <form ref="formElement" class="letter-form flex flex-col" @submit.prevent="handleFormSubmit">
          <div class="form-motion-surface flex flex-col">
            <Form />

            <ForumFormActions
              :loading="submitLoading"
              :disabled="finalIsDisabled"
              :error-count="validationErrorCount"
              @close="handleClose"
              @review-errors="focusFirstInvalid"
            />
          </div>

          <ForumFormActionBar
            :next-tab="nextTab"
            :in-transition="inSwitchTabTransition"
            @close="handleClose"
            @switch-tab="animateSwitchTab"
          />
        </form>
      </ForumPublishTopicStage>
    </DialogScrollContent>
  </Dialog>

  <Drawer v-else :open="isOpen" @update:open="handleOpenChange">
    <DrawerContent class="form-container feedback-drawer max-h-[calc(100dvh-24px)] overflow-clip" :aria-describedby="undefined" :data-phase="sendMotionActive ? 'closing' : submissionPhase">
      <ForumPublishTopicStage :form="form" :actions="actions">
        <form ref="formElement" class="letter-form flex flex-1 flex-col min-h-0 overflow-hidden" @submit.prevent="handleFormSubmit">
          <Form />
          <ForumFormActions
            :loading="submitLoading"
            :disabled="finalIsDisabled"
            :error-count="validationErrorCount"
            @close="handleClose"
            @review-errors="focusFirstInvalid"
          />
        </form>
      </ForumPublishTopicStage>
    </DrawerContent>
  </Drawer>
</template>

<style lang="scss" src="./ForumPublishTopicForm.scss"></style>
