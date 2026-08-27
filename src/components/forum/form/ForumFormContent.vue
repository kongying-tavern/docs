<script setup lang="ts">
import type { TabsConfig } from './publish-topic-form/types'
import { useMediaQuery } from '@vueuse/core'
import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { TabsContent } from '@/components/ui/tabs'
import { useLocalized } from '@/hooks/useLocalized'
import { IMAGE_UPLOAD_POLICY } from '~/services/forum/forumConfig'
import ForumContentInputBox from './publish-topic-form/ForumContentInputBox.vue'
import ForumPublishTopicFormField from './publish-topic-form/ForumPublishTopicFormField.vue'
import ForumTagsInput from './publish-topic-form/ForumTagsInput.vue'

interface Props {
  tabs: TabsConfig[]
}

interface Emits {
  (e: 'files-selected', files: File[]): void
}

defineProps<Props>()
defineEmits<Emits>()

const { message } = useLocalized()
const isDesktop = useMediaQuery('(min-width: 768px)')
</script>

<template>
  <div class="form-fields px-5 pb-5 md:px-4 sm:px-6">
    <TabsContent v-for="tab in tabs" :key="tab.value" :value="tab.value" class="mt-0">
      <div class="gap-5 grid w-full items-center md:gap-6">
        <FormField
          v-if="tab.fields?.title"
          v-slot="{ componentField }"
          name="title"
        >
          <ForumPublishTopicFormField
            for="title"
            :title="tab.fields.title?.label"
            :required="true"
          >
            <Input
              id="title"
              v-bind="componentField"
              type="text"
              :placeholder="tab.fields.title.placeholder"
              class="desktop-letter-input vp-border-input"
              :maxlength="tab.fields.title.maxLength"
              autocomplete="off"
            />
          </ForumPublishTopicFormField>
        </FormField>

        <FormField
          v-if="tab.fields?.tags"
          v-slot="{ componentField }"
          name="tags"
        >
          <ForumPublishTopicFormField
            for="tags"
            :title="tab.fields.tags.label"
            :required="tab.value === 'BUG'"
          >
            <ForumTagsInput
              id="tags"
              v-bind="componentField"
              :model-value="Array.isArray(componentField.modelValue) ? componentField.modelValue : []"
              class="w-full"
              :placeholder="tab.fields.tags.placeholder"
            />
          </ForumPublishTopicFormField>
        </FormField>

        <FormField
          v-if="tab.fields.content"
          v-slot="{ componentField }"
          name="text"
        >
          <ForumPublishTopicFormField
            for="content"
            :title="tab.fields.content.label"
            :required="true"
          >
            <ForumContentInputBox
              id="content"
              v-bind="componentField"
              :text-limit="tab.fields.content.maxLength"
              :text-min-limit="tab.fields.content.minLength"
              :class="isDesktop ? 'min-h-36' : 'min-h-28'"
              :placeholder="tab.fields.content.placeholder"
              :support-paste="true"
              @paste-files="$emit('files-selected', $event)"
            >
              <template v-if="!isDesktop" #uploader>
                <slot name="uploader" size="xl" />
              </template>
            </ForumContentInputBox>
          </ForumPublishTopicFormField>
        </FormField>

        <div
          v-if="isDesktop && tab.fields.upload"
          class="desktop-upload-field w-full md:pb-5"
        >
          <p class="text-sm leading-none font-medium mb-2">
            {{ tab.fields.upload.label }}
          </p>
          <p
            class="text-xs c-[var(--vp-c-text-3)] leading-normal"
            v-text="
              message.forum.publish.form?.upload?.tip
                ?.replace('%size', IMAGE_UPLOAD_POLICY.MAX_SIZE_LABEL)
                ?.replace('%range', String(IMAGE_UPLOAD_POLICY.MAX_COUNT)) || ''
            "
          />
          <slot name="uploader" size="lg" />
        </div>
      </div>
    </TabsContent>
  </div>
</template>
