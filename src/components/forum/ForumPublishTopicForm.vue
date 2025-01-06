<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { VisuallyHidden } from 'radix-vue'
import { useLocalized } from '@/hooks/useLocalized'
import { computed, readonly, ref, watch } from 'vue'
import ForumTagsInput from './ForumTagsInput.vue'
import { ReloadIcon } from '@radix-icons/vue'
import type ForumAPI from '@/apis/forum/api'
import { useHashChecker } from '@/hooks/useHashChecker'
import ForumContentInputBox from './ForumContentInputBox.vue'
import type { UploadUserFile } from '@/components/ui/photo-wall/upload'
import { createReusableTemplate, useMediaQuery } from '@vueuse/core'
import { useForumData } from '../../stores/useForumData'

const { message } = useLocalized()

const userInfo = useUserInfoStore()
const userAuth = useUserAuthStore()

const [UseForm, Form] = createReusableTemplate()
const [UseSubmit, SubmitButton] = createReusableTemplate()
const isDesktop = useMediaQuery('(min-width: 768px)')

useHashChecker(
  'publish-topic',
  () => {
    if (!userAuth.isTokenValid) return true
    isOpen.value = true
  },
  {
    redirectHash: 'login-alert',
  },
)

const isOpen = ref(false)
const type = ref<Exclude<ForumAPI.TopicType, null>>('SUG')
const tags = ref<string[]>([])
const title = ref('')
const isUploading = ref(false)
const uploadedImages = ref<string[]>([])
const body = ref<{
  text: string
  images: UploadUserFile[] | undefined
}>({
  text: '',
  images: [],
})

const { submitTopic } = useForumData()

const { loading, runAsync } = submitTopic()

const isDisabled = computed(() => {
  return loading.value || title.value.length === 0 || isUploading.value
})

type FieldConfig = {
  label: string
  placeholder: string
  maxLength: number
  show: boolean
}

type TabsConfig = {
  value: Exclude<ForumAPI.TopicType, null>
  label: string
  condition: boolean
  fields: {
    title: FieldConfig
    type: FieldConfig
    content: FieldConfig
  }
}[]

const formTabs = readonly<TabsConfig>([
  {
    value: 'SUG',
    label: message.value.forum.publish.type.sug,
    condition: true,
    fields: {
      title: {
        label: message.value.forum.publish.form.title.text,
        placeholder: message.value.forum.publish.form.title.placeholder,
        maxLength: 50,
        show: true,
      },
      type: {
        label: message.value.forum.publish.form.type.text,
        placeholder: message.value.forum.publish.form.type.placeholder,
        maxLength: 5,
        show: true,
      },
      content: {
        label: message.value.forum.publish.form.content.text,
        placeholder: message.value.forum.publish.form.content.placeholder,
        maxLength: 2000,
        show: true,
      },
    },
  },
  {
    value: 'BUG',
    label: message.value.forum.publish.type.bug,
    condition: true,
    fields: {
      title: {
        label: message.value.forum.publish.form.title.text,
        placeholder: message.value.forum.publish.form.title.placeholder,
        maxLength: 50,
        show: true,
      },
      type: {
        label: message.value.forum.publish.form.type.text,
        placeholder: message.value.forum.publish.form.type.placeholder,
        maxLength: 5,
        show: true,
      },
      content: {
        label: message.value.forum.publish.form.content.text,
        placeholder: message.value.forum.publish.form.content.placeholder,
        maxLength: 2000,
        show: true,
      },
    },
  },
  {
    value: 'FEAT',
    label: message.value.forum.publish.type.feat,
    condition: true,
    fields: {
      title: {
        label: message.value.forum.publish.form.title.text,
        placeholder: message.value.forum.publish.form.title.placeholder,
        maxLength: 50,
        show: true,
      },
      type: {
        label: message.value.forum.publish.form.type.text,
        placeholder: message.value.forum.publish.form.type.placeholder,
        maxLength: 5,
        show: false,
      },
      content: {
        label: message.value.forum.publish.form.content.text,
        placeholder: message.value.forum.publish.form.content.placeholder,
        maxLength: 2000,
        show: true,
      },
    },
  },
  {
    value: 'ANN',
    label: '发公告',
    condition: userInfo.isTeamMember(),
    fields: {
      title: {
        label: message.value.forum.publish.form.title.text,
        placeholder: message.value.forum.publish.form.title.placeholder,
        maxLength: 50,
        show: true,
      },
      type: {
        label: message.value.forum.publish.form.type.text,
        placeholder: message.value.forum.publish.form.type.placeholder,
        maxLength: 5,
        show: false,
      },
      content: {
        label: message.value.forum.publish.form.content.text,
        placeholder: message.value.forum.publish.form.content.placeholder,
        maxLength: 2000,
        show: true,
      },
    },
  },
])

const handleSubmit = async () => {
  body.value.images?.forEach((val, ind) => {
    if (val.status === 'uploading' || !val.url) return
    uploadedImages.value.push(val.url)
  })

  await runAsync(type.value, {
    title: title.value,
    tags: tags.value,
    content: {
      text: body.value.text,
      images: uploadedImages.value,
    },
  })

  isOpen.value = false
}

watch(
  () => body.value.images,
  () => {
    isUploading.value =
      body.value.images?.some((val) => val.status === 'uploading') ?? false
  },
  {
    deep: true,
  },
)
</script>

<template>
  <UseForm>
    <Tabs v-model="type" class="w-full m-auto px-4">
      <DialogHeader>
        <TabsList
          class="grid w-full mb-3"
          :class="userInfo.isTeamMember() ? 'grid-cols-4' : 'grid-cols-3'"
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

      <div class="vp-divider mb-6"></div>

      <TabsContent v-for="tab in formTabs" :key="tab.value" :value="tab.value">
        <div class="grid w-[100%] items-center gap-3">
          <!-- Title Field -->
          <div
            v-if="tab.fields.title.show"
            class="flex justify-between items-center w-full px-1"
          >
            <Label for="Title" class="required ml--2.5">
              {{ tab.fields.title?.label }}
            </Label>
            <span class="font-size-[13px] color-[var(--vp-c-text-3)]">
              {{ title.length }}/{{ tab.fields.title.maxLength }}
            </span>
          </div>
          <Input
            v-if="tab.fields.title.show"
            id="Title"
            type="text"
            :placeholder="tab.fields.title.placeholder"
            class="vp-border-input"
            :maxlength="tab.fields.title.maxLength"
            autocomplete="off"
            v-model="title"
          />

          <!-- Type Field -->
          <div
            v-if="tab.fields.type.show"
            class="flex justify-between items-center w-full px-1"
          >
            <Label for="labels">{{ tab.fields.type.label }}</Label>
            <span class="font-size-[13px] color-[var(--vp-c-text-3)]">
              {{ tags.length }}/{{ tab.fields.type.maxLength }}
            </span>
          </div>
          <ForumTagsInput
            v-if="tab.fields.type.show"
            id="label"
            :placeholder="tab.fields.type.placeholder"
            v-model="tags"
          />

          <!-- Content Field -->
          <div
            v-if="tab.fields.content.show"
            class="flex justify-between items-center w-full px-1"
          >
            <Label for="content">{{ tab.fields.content.label }}</Label>
            <span class="font-size-[13px] color-[var(--vp-c-text-3)]">
              {{ body.text.length }}/{{ tab.fields.content.maxLength }}
            </span>
          </div>
          <ForumContentInputBox
            v-if="tab.fields.content.show"
            v-model="body"
            :file-limit="3"
            :max-file-size="3"
            :auto-upload="true"
            :uploadTips="message.forum.publish.form.upload.tip"
          />
        </div>
      </TabsContent>
    </Tabs>
  </UseForm>

  <UseSubmit>
    <Button :disabled="isDisabled" @click="handleSubmit()">
      <ReloadIcon class="w-4 h-4 mr-2 animate-spin" v-if="loading" />
      {{
        loading
          ? message.forum.publish.publishLoading
          : message.ui.button.submit
      }}
    </Button>
  </UseSubmit>

  <Dialog v-if="isDesktop" v-model:open="isOpen">
    <DialogContent
      class="flex items-center flex-col max-w-[clamp(50vw,500px,90vw)]"
    >
      <VisuallyHidden>
        <DialogTitle>
          {{ message.forum.publish.title }}
        </DialogTitle>
      </VisuallyHidden>

      <Form />

      <DialogFooter class="mt-4 flex flex-wrap w-full px-4">
        <SubmitButton />
      </DialogFooter>
    </DialogContent>
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
