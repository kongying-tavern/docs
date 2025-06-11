<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHashChecker } from '@/hooks/useHashChecker'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { ReloadIcon } from '@radix-icons/vue'
import {
  createReusableTemplate,
  refAutoReset,
  useLocalStorage,
  useMediaQuery,
} from '@vueuse/core'
import { last } from 'lodash-es'
import { VisuallyHidden } from 'radix-vue'
import { computed, ref } from 'vue'

import ForumImageUpload from '~/components/forum/ForumImageUpload.vue'
import { useImageUpload } from '~/composables/useImageUpload'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { useSubmitTopic } from '~/composables/useSubmitTopic'

import {
  FORM_DATA_KEY,
  FORM_DEFAULT_DATA,
  FORM_HASH,
  getFormTabsConfig,
  MAX_UPLOAD_FILE_SIZE,
  TRANSITION_DURATION,
} from './config'
import ForumContentInputBox from './ForumContentInputBox.vue'
import ForumPublishTopicFormField from './ForumPublishTopicFormField.vue'
import ForumTagsInput from './ForumTagsInput.vue'

const formTabs = getFormTabsConfig()
const userAuth = useUserAuthStore()
const isOpen = ref(false)
const currentTabIndex = ref<number>(0)
const inSwitchTabTransition = refAutoReset(false, TRANSITION_DURATION)
const isDesktop = useMediaQuery('(min-width: 768px)')

const formData = useLocalStorage<ForumAPI.CreateTopicOption>(
  FORM_DATA_KEY,
  FORM_DEFAULT_DATA,
  {
    deep: true,
    mergeDefaults: false,
  },
)

const { message } = useLocalized()
const { loading, submitData } = useSubmitTopic()
const { isCompleted, markdownFormatImages, resetImageList, imageList, upload }
  = useImageUpload()
const [UseForm, Form] = createReusableTemplate()
const [UseSubmit, SubmitButton] = createReusableTemplate()
const [UseUploader, Uploader] = createReusableTemplate()
const { hasAnyPermissions } = useRuleChecks()

const hasPermission = hasAnyPermissions('manage_feedback')

const isDisabled = computed(() => {
  const currentTab = formTabs.find(tab => tab.value === formData.value.type)
  if (!currentTab)
    return true

  if (loading.value || !isCompleted.value)
    return true

  if (currentTab.value === 'ANN' && !hasPermission)
    return true

  if (currentTab.fields.title) {
    const titleLength = formData.value.title.length
    if (titleLength < (currentTab.fields.title.minLength ?? 0))
      return true
  }

  if (currentTab.fields.tags) {
    const tagsLength = formData.value.tags.length
    if (tagsLength < (currentTab.fields.tags.minLength ?? 0))
      return true
  }

  // 检查内容字段
  if (currentTab.fields.content) {
    const contentLength = formData.value.text.length
    if (contentLength < (currentTab.fields.content.minLength ?? 0))
      return true
  }

  return false
})

const tabList = computed(() => {
  return formTabs.map(val => val.value).filter((val) => {
    if (val === 'ANN' && !hasPermission)
      return false
    return true
  })
})
const nextTabIndex = computed(() => {
  return (currentTabIndex.value + 1) % tabList.value.length
})
const nextTab = computed(() => {
  return formTabs.find(val => val.value === tabList.value[nextTabIndex.value])
})

useHashChecker(
  [FORM_HASH, ...tabList.value.map(val => `${FORM_HASH}-${val}`)],
  (hash: string) => {
    if (!userAuth.isTokenValid)
      return true
    const targetTab = last(hash.split('-'))
    if (
      targetTab
      && tabList.value.includes(targetTab as ForumAPI.CreateTopicOption['type'])
    ) {
      formData.value.type = targetTab as ForumAPI.CreateTopicOption['type']
    }
    isOpen.value = true
  },
  {
    redirectHash: 'login-alert',
  },
)

function switchTab() {
  currentTabIndex.value = nextTabIndex.value
  if (formData.value.type === tabList.value[currentTabIndex.value])
    return switchTab()
  inSwitchTabTransition.value = true
  setTimeout(
    () => (formData.value.type = tabList.value[currentTabIndex.value]),
    TRANSITION_DURATION / 2,
  )
}

async function handleSubmit() {
  await submitData({
    ...formData.value,
    text: formData.value.text + markdownFormatImages.value,
  })

  isOpen.value = false
  initFormData()
}

function initFormData() {
  formData.value = FORM_DEFAULT_DATA
  resetImageList()
}
</script>

<template>
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

  <UseForm>
    <Tabs
      v-model="formData.type"
      class="form-content w-full px-4 md:rotate--1.4deg"
      :class="{ 'animate-switching': inSwitchTabTransition }"
    >
      <DialogHeader>
        <template v-if="isDesktop">
          <div
            v-for="tab in formTabs"
            v-show="formData.type === tab.value && tab?.condition"
            :key="tab.value"
          >
            <h2 class="mb-3 mt-18px font-size-28px">
              {{ tab.label }}
            </h2>
          </div>
        </template>
        <TabsList
          v-else
          class="grid mb-3 w-full"
          :class="hasPermission ? 'grid-cols-3' : 'grid-cols-2'"
        >
          <TabsTrigger
            v-for="tab in formTabs"
            v-show="tab?.condition"
            :key="tab.value"
            :value="tab.value"
          >
            {{ tab.label }}
          </TabsTrigger>
        </TabsList>
      </DialogHeader>

      <div class="mb-6 vp-divider md:border-width-2px md:border-style-dashed" />

      <TabsContent v-for="tab in formTabs" :key="tab.value" :value="tab.value">
        <div class="grid w-[100%] items-center gap-6">
          <!-- Title Field -->
          <ForumPublishTopicFormField
            v-if="tab.fields?.title"
            for="title"
            :title="tab.fields.title?.label"
            :required="true"
          >
            <Input
              id="title"
              v-model="formData.title"
              type="text"
              :placeholder="tab.fields.title.placeholder"
              class="vp-border-input"
              :maxlength="tab.fields.title.maxLength"
              autocomplete="off"
            />
          </ForumPublishTopicFormField>

          <!-- Tags Field -->
          <ForumPublishTopicFormField
            v-if="tab.fields?.tags"
            for="tags"
            :title="tab.fields.tags.label"
            :required="true"
          >
            <ForumTagsInput
              id="tags"
              v-model="formData.tags"
              class="w-full"
              :placeholder="tab.fields.tags.placeholder"
            />
          </ForumPublishTopicFormField>

          <!-- Content Field -->
          <ForumPublishTopicFormField
            v-if="tab.fields.content"
            for="content"
            :title="tab.fields.content.label"
          >
            <ForumContentInputBox
              id="content"
              v-model="formData.text"
              :text-limit="tab.fields.content.maxLength"
              :class="isDesktop ? 'min-h-128px' : 'min-h-100px'"
              :placeholder="tab.fields.content.placeholder"
            >
              <template v-if="!isDesktop" #uploader>
                <Uploader :file-limit="tab.fields.upload.maxLength" size="xl" :upload-tips="message.forum.publish.form.upload.tip" />
              </template>
            </ForumContentInputBox>
          </ForumPublishTopicFormField>

          <ForumPublishTopicFormField
            v-if="isDesktop"
            for="upload"
            :title="tab.fields.upload.label"
          >
            <p
              class="ml-1 text-sm c-[var(--vp-c-text-3)] leading-normal"
              v-text="
                message.forum.publish.form.upload.tip
                  .replace('%size', String(MAX_UPLOAD_FILE_SIZE))
                  .replace('%range', String(tab.fields.upload.maxLength))
              "
            />
            <Uploader :file-limit="tab.fields.upload.maxLength" size="lg" />
          </ForumPublishTopicFormField>
        </div>
      </TabsContent>
    </Tabs>
  </UseForm>

  <UseSubmit>
    <Button
      class="font-size-1.1em"
      :variant="isDesktop ? 'link' : 'default'"
      :disabled="isDisabled"
      @click="handleSubmit()"
    >
      <ReloadIcon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
      {{
        loading
          ? message.forum.publish.publishLoading
          : message.ui.button.submit
      }}
      {{ isDesktop ? '»' : '' }}
    </Button>
  </UseSubmit>

  <Dialog v-if="isDesktop" v-model:open="isOpen">
    <DialogScrollContent
      class="form-container paper mx-auto mb-70px mt-110px h-fit max-h-[1200px] min-h-100vh min-w-800px flex flex-col shadow-[var(--vp-shadow-3)] before:pos-absolute"
      :class="{ 'animate-switching': inSwitchTabTransition }"
    >
      <div
        class="action-bar absolute top-[-70px] flex flex-col items-start md:rotate--1.4deg"
        style="left: calc(0px - (100vw - 780px) / 2)"
      >
        <DialogClose class="form-close-btn">
          <Button class="form-action-btn" type="button" variant="secondary">
            <span> {{ message.ui.button.close }}</span>
            <span class="i-lucide:x icon-btn" />
          </Button>
        </DialogClose>

        <Button
          class="form-close-btn form-action-btn"
          type="button"
          variant="secondary"
          @click="switchTab"
        >
          <span> {{ nextTab?.label }}</span>
          <span
            class="i-lucide:refresh-cw icon-btn"
            :class="{ 'animate-spin': inSwitchTabTransition }"
          />
        </Button>
      </div>

      <VisuallyHidden>
        <DialogTitle>
          {{ message.forum.publish.title }}
        </DialogTitle>
      </VisuallyHidden>

      <Form />

      <DialogFooter
        class="form-footer-container sticky bottom-0 mt-8 w-full flex flex-wrap py-4 md:rotate--1.4deg"
        :class="{ 'animate-switching': inSwitchTabTransition }"
      >
        <SubmitButton class="min-w-96px" />
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>

  <Drawer v-else v-model:open="isOpen">
    <DrawerContent>
      <Form class="mt-4" />
      <DrawerFooter class="pt-4">
        <SubmitButton />
        <DrawerClose as-child>
          <Button
            variant="outline"
            class="border border-color-[var(--vp-c-gutter)] border-solid"
          >
            {{ message.ui.button.cancel }}
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>

<style lang="scss">
.form-container {
  --form-rotate-default: 1.4deg;
  --form-rotate-hover: 0deg;
  --paper-before-rotate: -3.9deg;
  --paper-after-rotate: -1.4deg;
  --fade-mid-rotate: -2.5deg;

  --translate-x: 100px;
  --translate-y: 150px;

  --fade-duration: 0.8s;
  --transition-short: 0.3s ease;
  --transition-bg: 0.25s ease;

  --hover-border-color: rgba(111, 99, 61, 0.4);
  --hover-border-width: 1px;
  --pseudo-border-color: rgba(66, 59, 35, 0.4);
  --pseudo-border-width: 1px;

  transform: rotate(var(--form-rotate-default));

  &:hover:not(:has(.action-bar:hover)) {
    transform: rotate(var(--form-rotate-hover));
    border: solid var(--hover-border-color);
    border-width: 0 0 0 var(--hover-border-width);

    .form-content,
    .form-footer-container {
      transform: rotate(var(--form-rotate-hover));
    }

    .action-bar {
      transform: rotate(calc(0 - var(--form-rotate-hover)));
    }

    &::before,
    &::after {
      transform: rotate(var(--form-rotate-hover));
      border: solid var(--pseudo-border-color);
      border-width: var(--pseudo-border-width) 0 0 var(--pseudo-border-width);
      transition: all 0.3s;
    }

    &::before {
      left: 6px;
      top: 6px;
    }

    &::after {
      left: 12px;
      top: 12px;
    }
  }
}

.form-container,
.form-footer-container,
.paper::before,
.paper::after {
  background-color: var(--vp-c-bg);
  background-image: radial-gradient(rgba(0, 0, 0, 0.05) 10%, transparent 20%),
    radial-gradient(rgba(0, 0, 0, 0.04) 15%, transparent 25%);
  background-size:
    4px 4px,
    3px 3px;
  background-position:
    0 0,
    1px 1px;
  transition: var(--transition-bg);
}

.paper::before,
.paper::after {
  content: '';
  --at-apply: absolute size-full sm: rounded-lg shadow-lg transform-preserve-3d
    perspective-1000px z--1 shadow-[var(--vp-shadow-3)];
}

.paper::before {
  left: -5px;
  top: 4px;
  transform: rotate(var(--paper-before-rotate));
}

.paper::after {
  top: 3px;
  right: 0;
  transform: rotate(var(--paper-after-rotate));
}

.action-bar > :not(:first-child) {
  --at-apply: mt-3;
}

.form-action-btn {
  transition: var(--transition-short);
  --at-apply: w-fit rounded-r-full ml--1.5;

  > :first-child {
    transition: var(--transition-short);
    --at-apply: inline-block overflow-hidden ml-1.5 max-w-0;
  }

  &:hover {
    > :first-child {
      max-width: 100px;
    }
  }
}

.animate-switching.paper {
  &::before {
    animation: paper-fade-in var(--fade-duration) ease-in-out;
  }
  &::after {
    animation: paper-fade-out var(--fade-duration) ease-in-out;
  }
}

.animate-switching.form-content,
.animate-switching.form-footer-container {
  animation: paper-fade-out var(--fade-duration) ease-in-out forwards;
}

@keyframes paper-fade-out {
  0% {
    transform: translateX(0) rotate(var(--paper-after-rotate));
    opacity: 1;
  }
  50% {
    transform: translateX(var(--translate-x)) rotate(var(--fade-mid-rotate));
    opacity: 0;
  }
  51% {
    transform: translateX(0) translateY(var(--translate-y))
      rotate(var(--paper-after-rotate));
    opacity: 0;
  }
  100% {
    transform: translateX(0) translateY(0) rotate(var(--paper-after-rotate));
    opacity: 1;
  }
}

@keyframes paper-fade-in {
  0% {
    transform: translateY(0) rotate(var(--paper-before-rotate));
    opacity: 1;
  }
  50% {
    transform: translateY(var(--translate-y)) rotate(var(--paper-before-rotate));
    opacity: 0;
  }
  51% {
    transform: translateX(calc(-1 * var(--translate-x)))
      rotate(var(--paper-before-rotate));
    opacity: 0;
  }
  100% {
    transform: translateX(0) rotate(var(--paper-before-rotate));
    opacity: 1;
  }
}
</style>
