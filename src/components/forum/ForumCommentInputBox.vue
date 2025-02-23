<template>
  <div v-motion-slide-top ref="commentInputBox" class="flex">
    <div class="user-avatar flex mr-2">
      <UserAvatar
        size="lg"
        :src="userInfo.info?.avatar"
        :alt="userInfo.info?.username"
      />
    </div>
    <div class="comment-area ml-4 w-[calc(100%-40px)]">
      <div class="body">
        <div
          class="rounded-md px-2 pt-2 w-full min-h-48px h-fit border border-color-[var(--vp-c-gutter)] focus:border-style-solid focus:bg-transparent bg-[var(--vp-c-bg-soft)]"
          :class="{ 'pb-2': hasSelectedFile }"
          v-if="userAuth.isTokenValid"
          @click="hideFooter = false"
        >
          <textarea
            class="w-full min-h-32px line-height-[32px] h-auto cursor-text font-size-3.5 bg-transparent"
            ref="textarea"
            v-model.trim="input"
            maxlength="500"
            :placeholder="
              placeholder
                ? placeholder
                : `${message.forum.comment.reply} ${replyTarget}@:`
            "
            :class="{ 'border-style-solid bg-transparent': !collapse }"
          >
          </textarea>
          <ForumImageUpload
            v-show="hasSelectedFile"
            v-model="imageList"
            id="upload"
            size="xl"
            ref="photoWallRef"
            :file-limit="3"
            :max-file-size="3"
            :auto-upload="true"
            :multiple="true"
            :hide-default-trigger="true"
          />
        </div>
        <div
          v-else
          class="h-8 w-full min-h-48px h-auto text-center rounded-md p-2 line-height-[32px] cursor-text font-size-3.5 bg-[var(--vp-c-bg-soft)]"
        >
          <DynamicTextReplacer
            :data="message.forum.comment.commentAfterLogin"
            class="important:line-height-[32px] important:m-0"
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
        v-motion-slide-top
        class="footer flex justify-between items-center mt-2.5"
        v-if="userAuth.isTokenValid"
        v-show="!collapse || !hideFooter || input?.length > 0"
      >
        <div class="tool">
          <Button
            variant="ghost"
            class="w-6 h-8 bg-transparent border border-solid border-[var(--vp-c-gutter)]"
            @click="open"
          >
            <span
              class="i-lucide:image icon-btn size-4 c-[var(--vp-c-text-2)]"
            ></span>
          </Button>
        </div>
        <div class="btn flex">
          <Button
            :disabled="loading || input?.length === 0 || isUploading"
            @click="submit()"
          >
            <ReloadIcon class="w-4 h-4 mr-2 animate-spin" v-if="loading" />
            {{ message.ui.button.submit }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { issues } from '@/apis/forum/gitee'
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'
import { Button } from '@/components/ui/button'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { ReloadIcon } from '@radix-icons/vue'
import { onClickOutside, useTextareaAutosize } from '@vueuse/core'
import { useLocalized } from '@/hooks/useLocalized'
import { useRequest } from 'vue-request'
import { toast } from 'vue-sonner'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useFileDialog } from '@vueuse/core'
import ForumImageUpload from '~/components/forum/ForumImageUpload.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { useImageUpload } from '~/composables/useImageUpload'

import type ForumAPI from '@/apis/forum/api'

const emit = defineEmits(['comment:submit'])

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

const userInfo = useUserInfoStore()
const userAuth = useUserAuthStore()
const hideFooter = ref(collapse)

const { message } = useLocalized()
const { textarea, input } = useTextareaAutosize()

const { open, onChange } = useFileDialog({
  accept: 'image/*',
  directory: false,
})
const { isUploading, markdownFormatImages, restImageList, imageList } =
  useImageUpload()
const { data, loading, runAsync, error } = useRequest(issues.postTopicComment, {
  manual: true,
})

const commentInputBoxRef = useTemplateRef('commentInputBox')
const photoWallRef = useTemplateRef('photoWallRef')
const hasSelectedFile = computed(() => imageList.value.length > 0)

onClickOutside(commentInputBoxRef, (event) => (hideFooter.value = true))

onChange((fileList) => {
  if (!(fileList && photoWallRef.value?.handleStart)) return

  for (const file of fileList) {
    photoWallRef.value.handleStart(Object.assign(file, { uid: Date.now() }))
  }
})

const submit = async () => {
  if (!userAuth.isTokenValid) location.hash = 'login-alert'

  await runAsync(
    repo,
    topicId,
    (replyTarget ? '@' + replyTarget + ' ' + input.value : input.value) +
      markdownFormatImages.value,
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

<style scoped>
textarea {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

textarea::-webkit-scrollbar {
  display: none;
}
</style>
