<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { VisuallyHidden } from 'radix-vue'
import { useData } from 'vitepress'
import { computed, ref, watch } from 'vue'
import ForumTagsInput from './ForumTagsInput.vue'
import { ReloadIcon } from '@radix-icons/vue'
import type ForumAPI from '@/apis/forum/api'
import { useHashChecker } from '@/hooks/useHashChecker'
import ForumContentInputBox from './ForumContentInputBox.vue'
import type { UploadUserFile } from '@/components/ui/photo-wall/upload'
import { useForumData } from '../../stores/useForumData'

const { theme } = useData()

const userInfo = useUserInfoStore()
const userAuth = useUserAuthStore()

const open = ref(false)
const type = ref<Exclude<ForumAPI.TopicType, null>>('SUG')
const tags = ref<string[]>([])
const title = ref('')
const uploading = ref(false)
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
  return loading.value || title.value.length === 0 || uploading.value
})

const formFields = computed(() => ({
  title: {
    label: theme.value.forum.publish.form.title.text,
    placeholder: theme.value.forum.publish.form.title.placeholder,
    maxLength: 50,
  },
  type: {
    label: theme.value.forum.publish.form.type.text,
    placeholder: theme.value.forum.publish.form.type.placeholder,
    maxLength: 5,
  },
  content: {
    label: theme.value.forum.publish.form.content.text,
    placeholder: theme.value.forum.publish.form.content.placeholder,
    maxLength: 2000,
  },
}))

useHashChecker(
  'publish-topic',
  () => {
    if (!userAuth.isTokenValid) return true
    open.value = true
  },
  {
    redirectHash: 'login-alert',
  },
)

const submit = async () => {
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

  open.value = false
}

watch(
  () => body.value.images,
  () => {
    uploading.value =
      body.value.images?.some((val) => val.status === 'uploading') ?? false
  },
  {
    deep: true,
  },
)
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex items-center flex-col max-w-[clamp(50vw,500px,90vw)]"
    >
      <VisuallyHidden>
        <DialogTitle>
          {{ theme.forum.publish.title }}
        </DialogTitle>
      </VisuallyHidden>

      <Tabs default-value="account" v-model="type" class="w-[90%]">
        <DialogHeader>
          <TabsList
            class="grid w-full mb-3"
            :class="userInfo.isTeamMember() ? 'grid-cols-4' : 'grid-cols-3'"
          >
            <TabsTrigger value="SUG">{{
              theme.forum.publish.type.sug
            }}</TabsTrigger>
            <TabsTrigger value="BUG">{{
              theme.forum.publish.type.bug
            }}</TabsTrigger>
            <TabsTrigger value="FEAT">{{
              theme.forum.publish.type.feat
            }}</TabsTrigger>
            <TabsTrigger v-if="userInfo.isTeamMember()" value="ANN">{{
              theme.forum.publish.type.ann
            }}</TabsTrigger>
          </TabsList>
        </DialogHeader>

        <div class="vp-divider mb-6"></div>

        <!-- Loop through all types to create reusable content -->
        <TabsContent
          v-for="typeValue in {
            sug: 'SUG',
            bug: 'BUG',
            feat: 'FEAT',
            ann: 'ANN',
          }"
          :key="typeValue"
          :value="typeValue"
        >
          <div class="grid w-[100%] items-center gap-3">
            <div class="flex justify-between items-center w-full">
              <Label for="Title" class="required">{{
                formFields.title.label
              }}</Label>
              <span class="font-size-[13px] color-[var(--vp-c-text-3)]"
                >{{ title.length }}/{{ formFields.title.maxLength }}</span
              >
            </div>
            <Input
              id="Title"
              type="text"
              :placeholder="formFields.title.placeholder"
              class="vp-border-input"
              :maxlength="formFields.title.maxLength"
              v-model="title"
            />

            <div class="flex justify-between items-center w-full">
              <Label for="labels">{{ formFields.type.label }}</Label>
              <span class="font-size-[13px] color-[var(--vp-c-text-3)]"
                >{{ tags.length }}/{{ formFields.type.maxLength }}</span
              >
            </div>
            <ForumTagsInput
              id="label"
              :placeholder="formFields.type.placeholder"
              v-model="tags"
            />

            <div class="flex justify-between items-center w-full">
              <Label for="content">{{ formFields.content.label }}</Label>
              <span class="font-size-[13px] color-[var(--vp-c-text-3)]"
                >{{ body.text.length }}/{{ formFields.content.maxLength }}</span
              >
            </div>

            <ForumContentInputBox
              v-model="body"
              :file-limit="3"
              :max-file-size="3"
              :auto-upload="true"
              :uploadTips="theme.forum.publish.form.upload.tip"
            />
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter class="mt-4 flex flex-wrap w-90%">
        <Button :disabled="isDisabled" @click="submit()">
          <ReloadIcon class="w-4 h-4 mr-2 animate-spin" v-if="loading" />
          {{
            loading
              ? theme.forum.publish.publishLoading
              : theme.ui.button.submit
          }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
