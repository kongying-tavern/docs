<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogScrollContent,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsTrigger, TabsList } from '@/components/ui/tabs'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { VisuallyHidden } from 'radix-vue'
import { useLocalized } from '@/hooks/useLocalized'
import { computed, ref, watch } from 'vue'
import ForumTagsInput from './ForumTagsInput.vue'
import { ReloadIcon } from '@radix-icons/vue'
import { useHashChecker } from '@/hooks/useHashChecker'
import ForumContentInputBox from './ForumContentInputBox.vue'
import { createReusableTemplate, useMediaQuery } from '@vueuse/core'
import { useTopicMannger } from '~/composables/useTopicMannger'
import {
  getFormTabsConfig,
  MAX_UPLOAD_FILE_SIZE,
  FORM_DEFAULT_DATA,
  FORM_DATA_KEY,
  TRANSITION_DURATION,
  FORM_HASH,
} from './config'
import ForumImageUpload from '~/components/forum/ForumImageUpload.vue'
import ForumPublishTopicFormField from './ForumPublishTopicFormField.vue'
import { useLocalStorage, refAutoReset } from '@vueuse/core'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { last } from 'lodash-es'

import type ForumAPI from '@/apis/forum/api'

const formTabs = getFormTabsConfig()
const userAuth = useUserAuthStore()
const isOpen = ref(false)
const isUploading = ref(false)
const uploadedImages = ref<string[]>([])
const currentTabIndex = ref<number>(0)
const inSwitchTabTransition = refAutoReset(false, TRANSITION_DURATION)
const isDesktop = useMediaQuery('(min-width: 768px)')

const formData = useLocalStorage<ForumAPI.CreateTopicOption>(
  FORM_DATA_KEY,
  FORM_DEFAULT_DATA,
)

const { message } = useLocalized()
const { submitTopic } = useTopicMannger()
const { loading, runAsync } = submitTopic()

const [UseForm, Form] = createReusableTemplate()
const [UseSubmit, SubmitButton] = createReusableTemplate()
const { hasAnyPermissions } = useRuleChecks()

const hasPermission = hasAnyPermissions('manage_feedback')

const isDisabled = computed(() => {
  return loading.value || formData.value.title.length === 0 || isUploading.value
})
const tabList = computed(() => {
  return formTabs.map((val) => val.value)
})
const nextTabIndex = computed(() => {
  return (currentTabIndex.value + 1) % tabList.value.length
})
const nextTab = computed(() => {
  return formTabs.find((val) => val.value === tabList.value[nextTabIndex.value])
})

useHashChecker(
  [FORM_HASH, ...tabList.value.map((val) => `${FORM_HASH}-${val}`)],
  (hash: string) => {
    if (!userAuth.isTokenValid) return true
    const targetTab = last(hash.split('-'))
    console.log(targetTab)
    if (targetTab && tabList.value.some((val) => val === targetTab)) {
      formData.value.type = targetTab as ForumAPI.CreateTopicOption['type']
    }
    isOpen.value = true
  },
  {
    redirectHash: 'login-alert',
  },
)

const switchTab = () => {
  currentTabIndex.value = nextTabIndex.value
  if (formData.value.type === tabList.value[currentTabIndex.value])
    return switchTab()
  inSwitchTabTransition.value = true
  setTimeout(
    () => (formData.value.type = tabList.value[currentTabIndex.value]),
    TRANSITION_DURATION / 2,
  )
}

const handleSubmit = async () => {
  formData.value.body.images?.forEach((val, ind) => {
    if (val.status === 'uploading' || !val.url) return
    uploadedImages.value.push(val.url)
  })

  await runAsync(formData.value)

  isOpen.value = false
  initFormData()
}

const initFormData = () => {
  formData.value = FORM_DEFAULT_DATA
  uploadedImages.value = []
  isUploading.value = false
}

watch(
  () => formData.value.body.images,
  () => {
    isUploading.value =
      formData.value.body.images?.some((val) => val.status === 'uploading') ??
      false
  },
  {
    deep: true,
  },
)
</script>

<template>
  <UseForm>
    <Tabs
      v-model="formData.type"
      class="form-content w-full px-4 md:rotate--1.4deg"
      :class="{ 'animate-switching': inSwitchTabTransition }"
    >
      <DialogHeader>
        <div
          v-if="isDesktop"
          v-for="tab in formTabs"
          v-show="formData.type === tab.value && tab?.condition"
          :key="tab.value"
        >
          <h2 class="font-size-28px mt-18px mb-3">
            {{ tab.label }}
          </h2>
        </div>
        <TabsList
          v-else
          class="grid w-full mb-3"
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

      <div
        class="vp-divider mb-6 md:border-width-2px md:border-style-dashed"
      ></div>

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
              type="text"
              :placeholder="tab.fields.title.placeholder"
              class="vp-border-input"
              :maxlength="tab.fields.title.maxLength"
              autocomplete="off"
              v-model="formData.title"
            />
          </ForumPublishTopicFormField>

          <!-- Tags Field -->
          <ForumPublishTopicFormField
            v-if="tab.fields?.tags"
            for="tags"
            :title="tab.fields.tags.label"
          >
            <ForumTagsInput
              id="tags"
              class="w-full"
              :placeholder="tab.fields.tags.placeholder"
              v-model="formData.tags"
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
              v-model="formData.body"
              :file-limit="tab.fields.upload.maxLength"
              :text-limit="tab.fields.content.maxLength"
              :max-file-size="MAX_UPLOAD_FILE_SIZE"
              :auto-upload="true"
              :multiple="true"
              :upload-tips="message.forum.publish.form.upload.tip"
              :is-upload-disabled="!isDesktop"
            />
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
            ></p>
            <ForumImageUpload
              id="upload"
              v-model="formData.body.images"
              size="lg"
              :file-limit="tab.fields.upload.maxLength"
              :max-file-size="MAX_UPLOAD_FILE_SIZE"
              :auto-upload="true"
              :multiple="true"
            />
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
      <ReloadIcon class="w-4 h-4 mr-2 animate-spin" v-if="loading" />
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
      class="paper form-container flex flex-col min-w-800px h-fit min-h-100vh mx-auto mt-110px mb-70px before:pos-absolute shadow-[var(--vp-shadow-3)]"
      :class="{ 'animate-switching': inSwitchTabTransition }"
    >
      <div
        class="action-bar absolute top-[-70px] md:rotate--1.4deg flex items-start flex-col"
        style="left: calc(0px - (100vw - 800px) / 2)"
      >
        <DialogClose class="form-close-btn">
          <Button class="form-action-btn" type="button" variant="secondary">
            <span> {{ message.ui.button.close }}</span>
            <span class="i-lucide:x icon-btn"></span>
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
          ></span>
        </Button>
      </div>

      <VisuallyHidden>
        <DialogTitle>
          {{ message.forum.publish.title }}
        </DialogTitle>
      </VisuallyHidden>

      <Form />

      <DialogFooter
        class="flex flex-wrap w-full mt-8 py-4 sticky bottom-0 md:rotate--1.4deg form-footer-container"
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
            class="border border-solid border-color-[var(--vp-c-gutter)]"
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
