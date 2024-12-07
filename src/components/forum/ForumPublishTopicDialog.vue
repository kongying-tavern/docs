<script setup lang="ts">
import ForumTagsInput from './ForumTagsInput.vue'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VisuallyHidden } from 'radix-vue'
import { useRequest } from 'vue-request'
import { toast } from 'vue-sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { issues } from '@/apis/forum/gitee'
import { useUserInfoStore, useUserAuthStore } from '@/stores'
import { ref, computed, inject, type Ref } from 'vue'
import { useData } from 'vitepress'

import type ForumAPI from '@/apis/forum/api'
import { useHashChecker } from '@/composables/useHashChecker'

const { theme } = useData()

const userInfo = useUserInfoStore()
const userAuth = useUserAuthStore()

const open = ref(false)
const type = ref<Exclude<ForumAPI.TopicType, null>>('SUG')
const tags = ref<string[]>([])
const title = ref('')
const body = ref('')

const submittedTopic = inject<Ref<ForumAPI.Topic[]>>('submittedTopic')!

const { data, runAsync, loading, error } = useRequest(issues.postTopic, {
  manual: true,
})

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

const submit = async () => {
  await runAsync(userAuth.accessToken, {
    body: body.value,
    title: `${type.value}:${title.value}`,
    labels: tags.value.join(','),
  })
  if (!data.value)
    return toast.error(
      theme.value.forum.publish.publishFail + error.value?.message,
    )
  submittedTopic.value.unshift(data.value)
  open.value = false
  toast.success(theme.value.forum.publish.publishSuccess, {
    action: {
      label: theme.value.forum.topic.menu.giteeLink,
      onClick: () => {
        issues.openTopicOnGitee(data.value?.id!)
      },
    },
  })
}
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
            <TabsTrigger value="sug">{{
              theme.forum.publish.type.sug
            }}</TabsTrigger>
            <TabsTrigger value="bug">{{
              theme.forum.publish.type.bug
            }}</TabsTrigger>
            <TabsTrigger value="feat">{{
              theme.forum.publish.type.feat
            }}</TabsTrigger>
            <TabsTrigger v-if="userInfo.isTeamMember()" value="ann">{{
              theme.forum.publish.type.ann
            }}</TabsTrigger>
          </TabsList>
        </DialogHeader>

        <div class="vp-divider mb-6"></div>

        <!-- Loop through all types to create reusable content -->
        <TabsContent
          v-for="(content, typeValue) in {
            sug: 'sug',
            bug: 'bug',
            feat: 'feat',
            ann: 'ann',
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
                >{{ body.length }}/{{ formFields.content.maxLength }}</span
              >
            </div>
            <Textarea
              v-model="body"
              id="content"
              :placeholder="formFields.content.placeholder"
              :maxlength="formFields.content.maxLength"
              class="h-36 vp-border-input"
            />
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter class="mt-4 flex flex-wrap w-90%">
        <p
          class="text-sm color-[var(--vp-c-text-3)] w-full"
          v-for="item in theme.forum.publish.tips"
        >
          * {{ item }}
        </p>
        <Button
          class="mt-4"
          :disabled="loading || title.length === 0"
          @click="submit()"
        >
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
