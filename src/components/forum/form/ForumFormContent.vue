<script setup lang="ts">
import type { TabsConfig } from './publish-topic-form/types'
import type ForumAPI from '@/apis/forum/api'
import { useMediaQuery } from '@vueuse/core'
import { computed } from 'vue'
import { Input } from '@/components/ui/input'
import { TabsContent } from '@/components/ui/tabs'
import { useLocalized } from '@/hooks/useLocalized'
import { MAX_UPLOAD_FILE_SIZE } from './publish-topic-form/config'
import ForumContentInputBox from './publish-topic-form/ForumContentInputBox.vue'
import ForumPublishTopicFormField from './publish-topic-form/ForumPublishTopicFormField.vue'
import ForumTagsInput from './publish-topic-form/ForumTagsInput.vue'

interface Props {
  modelValue: ForumAPI.CreateTopicOption
  tabs: TabsConfig[]
}

interface Emits {
  (e: 'update:modelValue', value: ForumAPI.CreateTopicOption): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { message } = useLocalized()
const isDesktop = useMediaQuery('(min-width: 768px)')

const formData = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
</script>

<template>
  <div class="form-fields min-h-200px">
    <TabsContent v-for="tab in tabs" :key="tab.value" :value="tab.value">
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
            :text-min-limit="tab.fields.content.minLength"
            :class="isDesktop ? 'min-h-128px' : 'min-h-100px'"
            :placeholder="tab.fields.content.placeholder"
          >
            <template v-if="!isDesktop" #uploader>
              <slot
                name="uploader"
                :file-limit="tab.fields.upload.maxLength"
                size="xl"
              />
            </template>
          </ForumContentInputBox>
        </ForumPublishTopicFormField>

        <!-- Upload Field (Desktop Only) -->
        <ForumPublishTopicFormField
          v-if="isDesktop && tab.fields.upload"
          for="upload"
          :title="tab.fields.upload.label"
        >
          <p
            class="ml-1 text-sm c-[var(--vp-c-text-3)] leading-normal"
            v-text="
              message.forum.publish.form?.upload?.tip
                ?.replace('%size', String(MAX_UPLOAD_FILE_SIZE))
                ?.replace('%range', String(tab.fields.upload.maxLength)) || ''
            "
          />
          <slot
            name="uploader"
            :file-limit="tab.fields.upload.maxLength"
            size="lg"
          />
        </ForumPublishTopicFormField>
      </div>
    </TabsContent>
  </div>
</template>
