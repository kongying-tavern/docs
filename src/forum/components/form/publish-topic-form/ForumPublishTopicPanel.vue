<script setup lang="ts">
import type { PublishTopicController, PublishTopicPresentation } from '../composables/usePublishTopicController'
import { OctagonXIcon, XIcon } from '@lucide/vue'
import { createReusableTemplate, useMediaQuery } from '@vueuse/core'
import { nextTick, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogDescription, DialogScrollContent, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { useLocalized } from '@/hooks/useLocalized'
import { useSitePreferences } from '~/composables/useSitePreferences'
import ForumImageUpload from '~/forum/components/form/ForumImageUpload.vue'
import ForumQuotedTopicCard from '~/forum/components/topic/ForumQuotedTopicCard.vue'
import ForumFormActionBar from '../ForumFormActionBar.vue'
import ForumFormActions from '../ForumFormActions.vue'
import ForumFormContent from '../ForumFormContent.vue'
import ForumFormTabs from '../ForumFormTabs.vue'

const props = defineProps<{ form: PublishTopicController['form'], upload: PublishTopicController['upload'], submission: PublishTopicController['submission'], actions: PublishTopicController['actions'] }>()
const { isOpen, formData, formTabs, nextTab, hasPermission, username, quotedTopicData, quotedTopicQuery, draftPromptOpen } = props.form
const { attachments, imageSelectionDisabled, remove, handleFilesSelected, handleRetry } = props.upload
const { submitLoading, submissionPhase, submissionAlert, validationErrorCount, finalIsDisabled } = props.submission
const { handleFormSubmit, handleClose, handleOpenChange, keepDraft, discardCurrentDraft, setFormType, switchTab, focusFirstInvalid } = props.actions
const { message } = useLocalized()
const { reducedMotion } = useSitePreferences()
const isDesktop = useMediaQuery('(min-width: 768px)')
const [UseForm, Form] = createReusableTemplate()
const [UseUploader, Uploader] = createReusableTemplate()
const formElement = useTemplateRef<HTMLFormElement>('formElement')
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
      :attachments="attachments"
      :disabled="imageSelectionDisabled"
      :size="size"
      @files-selected="handleFilesSelected"
      @remove="remove"
      @retry="handleRetry"
    />
  </UseUploader>

  <UseForm>
    <Alert v-if="submissionAlert" variant="destructive" class="mb-3 pr-9">
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

    <ForumFormTabs
      :model-value="formData.type"
      :tabs="formTabs"
      :has-permission="hasPermission"
      :username="username"
      @update:model-value="setFormType"
    >
      <ForumFormContent :tabs="formTabs" @files-selected="handleFilesSelected">
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
    </DialogScrollContent>
  </Dialog>

  <Drawer v-else :open="isOpen" @update:open="handleOpenChange">
    <DrawerContent class="form-container max-h-[calc(100dvh-8px)] overflow-hidden" :data-phase="sendMotionActive ? 'closing' : submissionPhase">
      <DrawerTitle class="sr-only">
        {{ message.forum.publish.title }}
      </DrawerTitle>
      <DrawerDescription class="sr-only">
        {{ message.forum.publish.form.content.placeholder }}
      </DrawerDescription>
      <form ref="formElement" class="letter-form flex flex-col min-h-0" @submit.prevent="handleFormSubmit">
        <Form />
        <ForumFormActions
          :loading="submitLoading"
          :disabled="finalIsDisabled"
          :error-count="validationErrorCount"
          @close="handleClose"
          @review-errors="focusFirstInvalid"
        />
      </form>
    </DrawerContent>
  </Drawer>

  <AlertDialog v-model:open="draftPromptOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ message.forum.publish.feedbackForm.keepDraftTitle }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ message.forum.publish.feedbackForm.keepDraftDescription }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <!-- 放弃草稿销毁用户内容，破坏性选项与保留选项需要视觉区分 -->
        <AlertDialogCancel
          class="text-destructive border-destructive/40 hover:bg-destructive/10"
          @click="discardCurrentDraft"
        >
          {{ message.forum.publish.feedbackForm.discardDraft }}
        </AlertDialogCancel>
        <AlertDialogAction @click="keepDraft">
          {{ message.forum.publish.feedbackForm.keepDraft }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style lang="scss" src="./ForumPublishTopicForm.scss"></style>
