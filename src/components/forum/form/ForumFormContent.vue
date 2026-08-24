<script setup lang="ts">
import type { TabsConfig } from './publish-topic-form/types'
import { useMediaQuery } from '@vueuse/core'
import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { TabsContent } from '@/components/ui/tabs'
import { useLocalized } from '@/hooks/useLocalized'
import { IMAGE_UPLOAD_POLICY } from '../constants'
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
  <div class="form-fields min-h-200px">
    <TabsContent v-for="tab in tabs" :key="tab.value" :value="tab.value">
      <div class="gap-6 grid w-full items-center">
        <!-- Title Field -->
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
              class="vp-border-input"
              :maxlength="tab.fields.title.maxLength"
              autocomplete="off"
            />
          </ForumPublishTopicFormField>
        </FormField>

        <!-- Tags Field -->
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
              class="w-full"
              :placeholder="tab.fields.tags.placeholder"
            />
          </ForumPublishTopicFormField>
        </FormField>

        <!-- Content Field -->
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
              :class="isDesktop ? 'min-h-128px' : 'min-h-100px'"
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

        <!-- Upload Field (Desktop Only) -->
        <div
          v-if="isDesktop && tab.fields.upload"
          class="border-b border-color-[var(--vp-c-border)] w-full not-last:border-b-solid"
        >
          <p class="text-[16px] leading-none font-medium mb-2">
            {{ tab.fields.upload.label }}
          </p>
          <p
            class="text-sm c-[var(--vp-c-text-3)] leading-normal ml-1"
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
