<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { issues } from '@/apis/forum/gitee'
import { Button } from '@/components/ui/button'
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { ReloadIcon } from '@radix-icons/vue'
import {
  onClickOutside,
  useFileDialog,
  useTextareaAutosize,
} from '@vueuse/core'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useRequest } from 'vue-request'
import { toast } from 'vue-sonner'

import ForumImageUpload from '~/components/forum/ForumImageUpload.vue'
import { useImageUpload } from '~/composables/useImageUpload'

const {
  topicId,
  replyTarget = '',
  placeholder = '',
  repo = 'Feedback',
  collapse = true,
} = defineProps<{
  topicId: string
  placeholder?: string
  replyTarget?: string
  collapse?: boolean
  repo: ForumAPI.Repo
}>()

const emit = defineEmits(['comment:submit'])

const userInfo = useUserInfoStore()
const userAuth = useUserAuthStore()
const hideFooter = ref(collapse)

const { message } = useLocalized()
const { textarea, input } = useTextareaAutosize()

const { open, onChange } = useFileDialog({
  accept: 'image/*',
  directory: false,
})
const { isUploading, markdownFormatImages, restImageList, imageList }
  = useImageUpload()
const { data, loading, runAsync, error } = useRequest(issues.postTopicComment, {
  manual: true,
})

const commentInputBoxRef = useTemplateRef('commentInputBox')
const photoWallRef = useTemplateRef('photoWallRef')
const hasSelectedFile = computed(() => imageList.value.length > 0)

onClickOutside(commentInputBoxRef, () => (hideFooter.value = true))

onChange((fileList) => {
  if (!(fileList && photoWallRef.value?.handleStart))
    return

  for (const file of fileList) {
    photoWallRef.value.handleStart(Object.assign(file, { uid: Date.now() }))
  }
})

async function submit() {
  if (!userAuth.isTokenValid)
    location.hash = 'login-alert'

  await runAsync(
    repo,
    topicId,
    (replyTarget ? `@${replyTarget} ${input.value}` : input.value)
    + markdownFormatImages.value,
  )

  emit('comment:submit', data)

  input.value = ''
  restImageList()
}

watch(data, (newVal) => {
  if (newVal) {
    toast.success(message.value.forum.comment.commentSuccess)
  }
})

watch(error, () => {
  toast.error(message.value.forum.comment.commentFail + error.value?.message)
})
</script>

<template>
  <div ref="commentInputBox" v-motion-slide-top class="flex">
    <div class="user-avatar mr-2 flex">
      <UserAvatar
        size="lg"
        :src="userInfo.info?.avatar"
        :alt="userInfo.info?.username"
      />
    </div>
    <div class="comment-area ml-4 w-[calc(100%-40px)]">
      <div class="body">
        <div
          v-if="userAuth.isTokenValid"
          class="h-fit min-h-48px w-full border border-color-[var(--vp-c-gutter)] rounded-md bg-[var(--vp-c-bg-soft)] px-2 pt-2 focus:border-style-solid focus:bg-transparent"
          :class="{ 'pb-2': hasSelectedFile }"
          @click="hideFooter = false"
        >
          <textarea
            ref="textarea"
            v-model.trim="input"
            class="h-auto min-h-32px w-full cursor-text bg-transparent font-size-3.5 line-height-[32px]"
            maxlength="500"
            :placeholder="
              placeholder
                ? placeholder
                : `${message.forum.comment.reply} @${replyTarget}:`
            "
            :class="{ 'border-style-solid bg-transparent': !collapse }"
          />
          <ForumImageUpload
            v-show="hasSelectedFile"
            id="upload"
            ref="photoWallRef"
            v-model="imageList"
            size="xl"
            :file-limit="3"
            :max-file-size="3"
            :auto-upload="true"
            :multiple="true"
            :hide-default-trigger="true"
          />
        </div>
        <div
          v-else
          class="h-8 h-auto min-h-48px w-full cursor-text rounded-md bg-[var(--vp-c-bg-soft)] p-2 text-center font-size-3.5 line-height-[32px]"
        >
          <DynamicTextReplacer
            :data="message.forum.comment.commentAfterLogin"
            class="important:m-0 important:line-height-[32px]"
          >
            <template #login>
              <a class="vp-link" href="#login-alert">
                [{{ message.forum.auth.login }}]
              </a>
            </template>
          </DynamicTextReplacer>
        </div>
      </div>
      <div
        v-if="userAuth.isTokenValid"
        v-show="!collapse || !hideFooter || input?.length > 0"
        v-motion-slide-top
        class="footer mt-2.5 flex items-center justify-between"
      >
        <div class="tool">
          <Button
            variant="ghost"
            class="h-8 w-6 border border-[var(--vp-c-gutter)] border-solid bg-transparent"
            @click="open"
          >
            <span
              class="i-lucide:image icon-btn size-4 c-[var(--vp-c-text-2)]"
            />
          </Button>
        </div>
        <div class="btn flex">
          <Button
            :disabled="loading || input?.length === 0 || isUploading"
            @click="submit()"
          >
            <ReloadIcon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ message.ui.button.submit }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
textarea {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

textarea::-webkit-scrollbar {
  display: none;
}
</style>
