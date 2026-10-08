<script setup lang="ts">
import type { PublishTopicController, PublishTopicPresentation } from '../composables/usePublishTopicController'
import type { FORUM } from '~/forum/components/types'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, LoaderCircleIcon, Maximize2Icon, Minimize2Icon, PaperclipIcon, Trash2Icon, XIcon } from '@lucide/vue'
import { createReusableTemplate, useMediaQuery } from '@vueuse/core'
import { computed, nextTick, ref, unref, useTemplateRef, watch } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { FormField } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useLocalized } from '@/hooks/useLocalized'
import ForumImageUpload from '~/forum/components/form/ForumImageUpload.vue'
import ForumQuotedTopicCard from '~/forum/components/topic/ForumQuotedTopicCard.vue'
import ForumTopicTypeBadge from '~/forum/components/ui/ForumTopicTypeBadge.vue'
import ForumResponsiveMenu from '~/forum/components/ui/responsive/ForumResponsiveMenu.vue'
import { useForumImageDropZone } from '~/forum/composables/view/useForumImageDropZone'
import { IMAGE_UPLOAD_POLICY } from '~/forum/services/forumConfig'
import { toast } from '~/services/telemetry/toast'
import { useMobilePublishViewport } from '../composables/useMobilePublishViewport'
import ForumCompactProperties from './ForumCompactProperties.vue'
import ForumContentInputBox from './ForumContentInputBox.vue'
import ForumDeleteDraftDialog from './ForumDeleteDraftDialog.vue'
import ForumDraftSaveStatus from './ForumDraftSaveStatus.vue'
import ForumKeepDraftDialog from './ForumKeepDraftDialog.vue'

import ForumPublishTopicStage from './ForumPublishTopicStage.vue'

const props = defineProps<{ form: PublishTopicController['form'], upload: PublishTopicController['upload'], submission: PublishTopicController['submission'], actions: PublishTopicController['actions'] }>()
const { showCreateMore, isOpen, choosingType, editingSavedDraft, autoSaveEnabled, autoSaveStatus, savedAt, editorIdle, deleteDraftPromptOpen, deleteDraftError, formData, formTabs, quotedTopicData, quotedTopicQuery, draftPromptOpen, isDirty, draftSaving, draftSaveError } = props.form
const { attachments, imageSelectionDisabled, remove, handleFilesSelected, handleRetry } = props.upload
const { submitLoading, submissionAlert, validationErrorCount, finalIsDisabled } = props.submission
const { handleFormSubmit, handleClose, handleOpenChange, keepDraft, discardCurrentDraft, setFormType, focusFirstInvalid, saveDraft, setQuotedTopic } = props.actions
const { message } = useLocalized()
const copy = computed(() => message.value.forum.publish.feedbackForm)
const desktopViewport = useMediaQuery('(min-width: 768px)')
const isDesktop = ref(desktopViewport.value)
// Keep the parent modal mounted while a draft confirmation owns focus.
watch([desktopViewport, draftPromptOpen, deleteDraftPromptOpen], ([desktop, keepingDraft, deletingDraft]) => {
  if (!keepingDraft && !deletingDraft)
    isDesktop.value = desktop
})
const expanded = ref(false)
const createMore = ref(false)
watch(showCreateMore, (visible) => {
  if (!visible)
    createMore.value = false
})
const activeTab = computed(() => formTabs.value.find(tab => tab.value === formData.value.type)!)
const allowedTabs = computed(() => formTabs.value.filter(tab => unref(tab.condition)))
const typeItems = computed<FORUM.TopicDropdownMenu[]>(() => allowedTabs.value.filter(tab => tab.value !== formData.value.type).map(tab => ({
  id: `compact-form-type-${tab.value}`,
  type: 'item',
  label: tab.label,
  topicType: tab.value,
  disabled: submitLoading.value,
  action: () => selectType(tab.value),
})))
const canSaveDraft = computed(() => !autoSaveEnabled.value && (isDirty.value || draftSaving.value))
const formElement = useTemplateRef<HTMLFormElement>('formElement')
const { drawerStyle, keyboardVisible } = useMobilePublishViewport(isOpen, isDesktop, formElement)
const { isOverDropZone } = useForumImageDropZone(formElement, {
  disabled: imageSelectionDisabled,
  onFiles: handleFilesSelected,
})
const uploader = useTemplateRef<InstanceType<typeof ForumImageUpload>>('uploader')
const [UseForm, Form] = createReusableTemplate()
const [UseClose, Close] = createReusableTemplate()
async function save() {
  if (await saveDraft())
    toast.success(copy.value.draftSaved)
  else if (draftSaveError.value)
    toast.error(draftSaveError.value, { report: false })
}
function selectType(type: string) {
  if (type === 'BUG' || type === 'FEAT' || type === 'ANN')
    setFormType(type)
}
function returnToTypes() {
  const focused = document.activeElement
  if (focused instanceof HTMLElement && formElement.value?.contains(focused))
    focused.blur()
  props.actions.returnToTypeSelection()
}
async function focus(selector: string) {
  await nextTick()
  const element = formElement.value?.querySelector<HTMLElement>(selector)
  element?.focus({ preventScroll: true })
  element?.scrollIntoView({ block: 'nearest' })
}
const presentation: PublishTopicPresentation = {
  focusValidation: field => void focus(`#${CSS.escape(field === 'text' ? 'content' : field || 'content')}`),
  settleSend: async () => {},
  focusUploadFailure: () => void focus('[data-status="failed"] button'),
  createMore: () => createMore.value,
}
defineExpose(presentation)
</script>

<template>
  <UseClose>
    <Button type="button" variant="ghost" size="icon-xs" class="compact-close compact-corner-button" :disabled="submitLoading || draftSaving" :aria-label="message.ui.button.close" @click="handleClose">
      <XIcon class="size-3.5" />
    </Button>
  </UseClose>
  <UseForm>
    <form ref="formElement" :inert="draftSaving" class="compact-form" @input="actions.markEditorActive" @keydown="actions.markEditorActive" @pointerdown="actions.markEditorActive" @submit.prevent="handleFormSubmit">
      <header class="compact-header">
        <div class="compact-heading">
          <ForumResponsiveMenu v-if="isDesktop" :items="typeItems" :title="message.forum.topic.menu.changeType.text" align="start">
            <template #trigger>
              <Button type="button" variant="secondary" size="xs" data-publish-type-target class="compact-type compact-corner-button" :disabled="submitLoading || draftSaving">
                <ForumTopicTypeBadge data-publish-type-label class="compact-type-badge" :type="formData.type" />
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            </template>
          </ForumResponsiveMenu>
          <Button v-else type="button" variant="secondary" size="xs" data-publish-type-target class="compact-type compact-corner-button" :disabled="submitLoading || draftSaving" :aria-label="copy.backToTypes" @click="returnToTypes">
            <ChevronLeftIcon data-icon="inline-start" />
            <ForumTopicTypeBadge data-publish-type-label class="compact-type-badge" :type="formData.type" />
          </Button>
          <ChevronRightIcon class="text-muted-foreground shrink-0 size-3.5" aria-hidden="true" />
          <span class="compact-heading-title">{{ editingSavedDraft ? copy.editDraft : copy.newFeedback }}</span>
        </div>
        <div class="compact-header-actions">
          <ForumDraftSaveStatus v-if="autoSaveEnabled" :status="autoSaveStatus" :saved-at="savedAt" :idle="editorIdle" />
          <Button v-if="canSaveDraft" type="button" variant="secondary" size="xs" class="compact-corner-button" :disabled="submitLoading || draftSaving" @click="save">
            <LoaderCircleIcon v-if="draftSaving" class="animate-spin" data-icon="inline-start" />
            {{ draftSaving ? copy.savingDraft : copy.saveDraft }}
          </Button>
          <Button v-if="editingSavedDraft" type="button" variant="ghost" size="icon-xs" class="compact-corner-button" :disabled="submitLoading || draftSaving" :aria-label="copy.deleteDraft" :title="copy.deleteDraft" @click="actions.requestDeleteDraft">
            <Trash2Icon />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" class="compact-corner-button" :aria-label="expanded ? copy.collapse : copy.expand" :title="expanded ? copy.collapse : copy.expand" :aria-pressed="expanded" @click="expanded = !expanded">
            <Minimize2Icon v-if="expanded" class="size-3.5" /><Maximize2Icon v-else class="size-3.5" />
          </Button>
        </div>
      </header>
      <div class="compact-body custom-scrollbar">
        <Alert v-if="submissionAlert" variant="destructive" class="mb-4">
          <AlertTitle>{{ submissionAlert.title }}</AlertTitle>
          <AlertDescription class="whitespace-pre-wrap">
            {{ submissionAlert.description }}
          </AlertDescription>
        </Alert>
        <FormField v-if="activeTab.fields.title" v-slot="{ field, errorMessage }" name="title">
          <Field :data-invalid="Boolean(errorMessage)" class="mb-4 gap-2">
            <FieldLabel for="title" class="sr-only">
              {{ activeTab.fields.title.label }}
            </FieldLabel>
            <input id="title" v-bind="field" class="compact-title" :aria-invalid="Boolean(errorMessage)" :aria-describedby="errorMessage ? 'title-error' : undefined" :disabled="submitLoading || draftSaving" :maxlength="activeTab.fields.title.maxLength" :placeholder="activeTab.fields.title.placeholder" autocomplete="off" data-clarity-mask="true">
            <FieldError v-if="errorMessage" id="title-error">
              {{ errorMessage }}
            </FieldError>
          </Field>
        </FormField>
        <FormField v-slot="{ componentField, errorMessage }" name="text">
          <Field :data-invalid="Boolean(errorMessage)" class="compact-content-field gap-2">
            <FieldLabel class="sr-only">
              {{ activeTab.fields.content.label }}
            </FieldLabel>
            <div class="compact-editor-container" :inert="submitLoading || undefined">
              <ForumContentInputBox id="content" v-bind="componentField" class="compact-editor" borderless :placeholder="activeTab.fields.content.placeholder" :aria-label="activeTab.fields.content.label" :aria-invalid="Boolean(errorMessage)" :aria-describedby="errorMessage ? 'content-error' : undefined" :support-paste="true" :support-drop="false" :image-selection-disabled="imageSelectionDisabled" @paste-files="handleFilesSelected" />
            </div>
            <FieldError v-if="errorMessage" id="content-error">
              {{ errorMessage }}
            </FieldError>
          </Field>
        </FormField>
        <ForumImageUpload ref="uploader" :attachments="attachments" :disabled="imageSelectionDisabled" hide-default-trigger card-preview size="sm" :class="{ 'compact-empty-uploader': !attachments.length }" @files-selected="handleFilesSelected" @remove="remove" @retry="handleRetry" />
        <FormField v-slot="{ componentField, errorMessage }" name="tags">
          <Field :data-invalid="Boolean(errorMessage)" class="compact-properties gap-2">
            <FieldLabel class="sr-only">
              {{ copy.selectTags }}
            </FieldLabel>
            <ForumCompactProperties :tags="componentField.modelValue || []" :quoted-topic="formData.quotedTopic" :disabled="submitLoading || draftSaving" :aria-invalid="Boolean(errorMessage)" :aria-describedby="errorMessage ? 'tags-error' : undefined" @update:tags="componentField['onUpdate:modelValue']" @update:quoted-topic="setQuotedTopic" />
            <FieldError v-if="errorMessage" id="tags-error">
              {{ errorMessage }}
            </FieldError>
          </Field>
        </FormField>
        <div v-if="formData.quotedTopic" class="mt-4 relative">
          <ForumQuotedTopicCard :reference="formData.quotedTopic" :topic="quotedTopicData" :loading="quotedTopicQuery.isLoading.value || (!quotedTopicData && !quotedTopicQuery.error.value)" :unavailable="Boolean(quotedTopicQuery.error.value)" :interactive="false" removable :remove-disabled="submitLoading" @retry="quotedTopicQuery.refetch()" @remove="setQuotedTopic(undefined)" />
        </div>
      </div>
      <footer class="compact-footer">
        <Button type="button" variant="secondary" size="icon-sm" class="compact-corner-button" :aria-label="copy.addImages" :title="copy.addImages" :disabled="imageSelectionDisabled || attachments.length >= IMAGE_UPLOAD_POLICY.MAX_COUNT" @click="uploader?.open()">
          <PaperclipIcon />
        </Button>
        <div class="compact-footer-actions">
          <label v-if="showCreateMore" for="compact-create-more" class="compact-toggle">
            <Switch id="compact-create-more" v-model="createMore" :disabled="finalIsDisabled" />
            <span>{{ copy.createMore }}</span>
          </label>
          <label for="compact-private-feedback" class="compact-toggle" :title="copy.privateFeedbackVisibility">
            <Switch id="compact-private-feedback" :model-value="formData.isPrivate === true" :disabled="finalIsDisabled" :aria-description="copy.privateFeedbackDescription" @update:model-value="actions.setPrivate" />
            <span>{{ copy.privateFeedback }}</span>
          </label>
          <Button type="submit" size="sm" class="compact-corner-button" :disabled="finalIsDisabled">
            <LoaderCircleIcon v-if="submitLoading" class="animate-spin" data-icon="inline-start" />{{ submitLoading ? message.forum.publish.publishLoading : copy.submit }}
          </Button>
        </div>
        <button v-if="validationErrorCount" type="button" class="compact-validation" @click="focusFirstInvalid">
          {{ copy.fieldsNeedAttention.replace('{count}', String(validationErrorCount)) }}
        </button>
      </footer>
      <div v-if="isOverDropZone" class="compact-drop-overlay" aria-hidden="true">
        <PaperclipIcon />
        <span>{{ copy.addImages }}</span>
      </div>
    </form>
  </UseForm>
  <Dialog v-if="isDesktop" :open="isOpen" @update:open="handleOpenChange">
    <DialogContent class="compact-dialog srounded-[var(--compact-radius)]" :class="{ 'compact-expanded': expanded }" :show-close-button="false">
      <DialogTitle class="sr-only">
        {{ copy.newFeedback }}
      </DialogTitle>
      <DialogDescription class="sr-only">
        {{ message.forum.publish.form.content.placeholder }}
      </DialogDescription>
      <Close />
      <ForumPublishTopicStage :form="form" :actions="actions" morph-type hide-close-button>
        <Form />
      </ForumPublishTopicStage>
    </DialogContent>
  </Dialog>
  <Drawer v-else :open="isOpen" @update:open="handleOpenChange">
    <DrawerContent class="compact-drawer data-[vaul-drawer-direction=bottom]:srounded-t-[var(--compact-radius)]" :class="{ 'compact-choosing-type': choosingType, 'compact-expanded': expanded, 'compact-keyboard-visible': keyboardVisible }" :style="drawerStyle" :aria-describedby="undefined">
      <DrawerTitle class="sr-only">
        {{ copy.newFeedback }}
      </DrawerTitle>
      <Close />
      <ForumPublishTopicStage :form="form" :actions="actions" fixed-height hide-close-button>
        <Form />
      </ForumPublishTopicStage>
    </DrawerContent>
  </Drawer>
  <ForumDeleteDraftDialog v-model:open="deleteDraftPromptOpen" :error="deleteDraftError" @confirm="actions.confirmDeleteDraft" />
  <ForumKeepDraftDialog v-model:open="draftPromptOpen" :saving="draftSaving" :error="draftSaveError" @save="keepDraft" @discard="discardCurrentDraft" />
</template>

<style scoped>
:global(.compact-dialog[data-slot='dialog-content']),
:global(.compact-drawer[data-slot='drawer-content']) {
  --compact-control-size: 32px;
  --compact-control-radius: calc(var(--compact-control-size) / 2);
  --compact-radius: calc(var(--compact-inset) + var(--compact-control-radius));
  --srounded-scale: 1;
  --compact-corner-radius: var(--compact-radius);
  --compact-inset: 16px;
}
@supports (corner-shape: superellipse(1)) {
  :global(.compact-dialog[data-slot='dialog-content']),
  :global(.compact-drawer[data-slot='drawer-content']) {
    --compact-corner-radius: calc(var(--compact-radius) * var(--srounded-scale, 1.6));
  }
}
:global(.compact-dialog[data-slot='dialog-content']) {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  width: min(760px, calc(100vw - 48px));
  max-width: none;
  top: clamp(24px, 10vh, 96px);
  translate: -50% 0;
  max-height: calc(100dvh - clamp(24px, 10vh, 96px) - 24px);
  overflow: clip;
}
:global(.compact-dialog.compact-expanded[data-slot='dialog-content']) {
  width: min(1120px, calc(100vw - 48px));
  top: 24px;
  height: calc(100dvh - 48px);
  max-height: calc(100dvh - 48px);
}
.compact-form {
  corner-shape: inherit;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 auto;
}
.compact-drop-overlay {
  position: absolute;
  inset: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px dashed oklch(var(--ring));
  border-radius: max(0px, calc(var(--compact-corner-radius) - 6px));
  corner-shape: inherit;
  background: color-mix(in srgb, var(--vp-c-bg-elv) 86%, transparent);
  color: var(--vp-c-brand-1);
  pointer-events: none;
}
.compact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: var(--compact-inset);
  padding-inline-end: calc(var(--compact-inset) + var(--compact-control-size) + 6px);
  flex-shrink: 0;
}
.compact-heading,
.compact-header-actions,
.compact-footer-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.compact-heading-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  @apply text-ui-13;
  font-weight: 500;
  white-space: nowrap;
}
.compact-header-actions {
  flex-shrink: 0;
}
.compact-close {
  position: absolute;
  top: calc(var(--compact-inset) + var(--compact-header-offset, 0px));
  right: var(--compact-inset);
  z-index: 1;
}
.compact-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-inline-end: 2px;
  color: oklch(var(--muted-foreground));
  @apply text-ui-12;
  white-space: nowrap;
}
.compact-footer-actions > [type='submit'] {
  margin-inline-start: 12px;
}
.compact-heading {
  gap: 8px;
}
.compact-type[data-size='xs'] {
  padding-inline: 10px;
  gap: 8px;
}
.compact-corner-button {
  height: var(--compact-control-size);
  border-radius: 9999px;
  corner-shape: round;
}
.compact-corner-button[data-size^='icon'] {
  width: var(--compact-control-size);
}
.compact-corner-button:not([type='submit']),
.compact-properties :deep([data-slot='popover-trigger']) {
  color: oklch(var(--muted-foreground));
  transition: color 150ms ease;
}
.compact-corner-button:not([type='submit']):is(
    :hover,
    :active,
    :focus-visible,
    [data-state='open'],
    [aria-pressed='true']
  ):not(:disabled),
.compact-properties
  :deep([data-slot='popover-trigger']:is(:hover, :active, :focus-visible, [data-state='open']):not(:disabled)) {
  color: oklch(var(--foreground));
}
.compact-type-badge :deep(.size-12px) {
  width: 10px;
  height: 10px;
}
.compact-type-badge :deep(> span:first-child) {
  margin-right: 6px;
}
.compact-form :deep([data-size='xs'] svg) {
  width: 12px;
  height: 12px;
}
.compact-header-actions :deep(svg) {
  width: 14px;
  height: 14px;
}
html[data-reduced-motion='true'] .compact-corner-button,
html[data-reduced-motion='true'] .compact-properties :deep([data-slot='popover-trigger']) {
  transition: none;
}
.compact-footer :deep([data-size='icon-sm'] svg) {
  width: 16px;
  height: 16px;
}
.compact-body {
  display: flex;
  flex-direction: column;
  padding: 8px var(--compact-inset) var(--compact-inset);
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scroll-padding-block: 12px;
  min-height: 0;
  flex: 1;
}
.compact-body > * {
  flex-shrink: 0;
}
:global(.compact-dialog .type-motion-active .compact-body),
:global(.compact-dialog .type-motion-active .forum-rich-editor) {
  overflow: clip;
}
.compact-content-field {
  flex: 1;
  min-height: 120px;
}
.compact-editor-container,
.compact-editor-container :deep(.comment-area),
.compact-editor-container :deep(.compact-content-input),
.compact-editor-container :deep(.editor) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.compact-editor-container > :deep(div) {
  flex: 1;
  min-height: 0;
}
.compact-title {
  width: 100%;
  background: transparent;
  border: 0;
  padding: 0;
  @apply text-ui-22;
  font-weight: 600;
  line-height: 1.5;
  color: oklch(var(--foreground));
  outline: none;
}
.compact-title::placeholder {
  color: oklch(var(--muted-foreground));
}
.compact-body :deep(.compact-editor) {
  flex: 1;
  min-height: 0;
}
.compact-editor-container :deep(.tiptap) {
  min-height: 100%;
}
.compact-body :deep(.forum-rich-editor) {
  max-height: none;
}
.compact-properties {
  margin-top: 16px;
}
.compact-empty-uploader {
  height: 0;
  overflow: hidden;
}
.compact-footer {
  padding: var(--compact-inset);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.compact-validation {
  order: -1;
  width: 100%;
  text-align: right;
  color: oklch(var(--destructive));
  @apply text-ui-12;
}
.compact-validation:hover {
  text-decoration: underline;
}
:global(.compact-drawer[data-slot='drawer-content']) {
  --compact-header-offset: 24px;
  bottom: var(--compact-viewport-bottom, 0px);
  height: min(calc(var(--compact-viewport-height, 100dvh) * 0.8), calc(var(--compact-viewport-height, 100dvh) - 12px));
  max-height: calc(var(--compact-viewport-height, 100dvh) - 12px) !important;
  overflow: clip;
  transition: height 200ms ease-in-out;
}
:global(.compact-drawer.compact-expanded[data-slot='drawer-content']),
:global(.compact-drawer.compact-keyboard-visible[data-slot='drawer-content']) {
  height: calc(var(--compact-viewport-height, 100dvh) - 12px);
}
:global(.compact-drawer.compact-keyboard-visible[data-slot='drawer-content']) {
  transition: none;
}
:global(.compact-drawer.compact-choosing-type[data-slot='drawer-content']) {
  height: auto;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
}
html[data-reduced-motion='true'] :global(.compact-drawer[data-slot='drawer-content']) {
  transition: none;
}
@media (max-width: 767px) {
  .compact-corner-button:not(.compact-close),
  .compact-properties :deep([data-slot='popover-trigger']) {
    position: relative;
  }
  .compact-corner-button::before,
  .compact-properties :deep([data-slot='popover-trigger']::before) {
    content: '';
    position: absolute;
    inset: -6px 0;
  }
  .compact-properties :deep([data-slot='popover-trigger']) {
    height: var(--compact-control-size);
    max-width: 100%;
    @apply text-ui-12;
    padding-inline: 10px;
  }
  .compact-properties :deep([data-slot='popover-trigger'] > span) {
    min-width: 0;
  }
  .compact-properties :deep(.flex-wrap) {
    row-gap: 12px;
  }
  .compact-drop-overlay {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  .compact-header {
    padding: var(--compact-inset);
    padding-inline-end: calc(var(--compact-inset) + var(--compact-control-size) + 6px);
    gap: 6px;
  }
  .compact-header-actions {
    margin-left: auto;
  }
  .compact-heading-title {
    @apply text-ui-13;
  }
  .compact-body {
    padding: var(--compact-inset);
  }
  .compact-footer {
    padding: var(--compact-inset) var(--compact-inset) max(var(--compact-inset), env(safe-area-inset-bottom));
    gap: 6px;
  }
  .compact-footer-actions {
    margin-inline-start: auto;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }
}
@media (max-width: 380px) {
  .compact-heading > svg,
  .compact-heading-title {
    display: none;
  }
}
</style>
