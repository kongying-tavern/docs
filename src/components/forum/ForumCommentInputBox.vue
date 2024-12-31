<template>
  <div class="flex">
    <div class="user-avatar flex mr-2">
      <UserAvatar
        size="lg"
        :src="userInfo.info?.avatar"
        :alt="userInfo.info?.username"
      />
    </div>
    <div class="comment-area ml-4 w-[calc(100%-40px)]">
      <div class="body">
        <!-- TODO: 字数表现 -->
        <textarea
          v-if="userAuth.isTokenValid"
          ref="textarea"
          v-model.trim="input"
          maxlength="500"
          :placeholder="placeholder"
          class="h-8 w-full min-h-48px h-auto rounded-md p-2 line-height-[32px] cursor-text border font-size-3.5 border-color-[var(--vp-c-gutter)] focus:border-style-solid focus:bg-transparent bg-[var(--vp-c-bg-soft)]"
        >
        </textarea>
        <div
          v-else
          class="h-8 w-full min-h-48px h-auto text-center rounded-md p-2 line-height-[32px] cursor-text font-size-3.5 bg-[var(--vp-c-bg-soft)]"
        >
          <DynamicTextReplacer :data="theme.forum.comment.commentAfterLogin">
            <template #login>
              <a class="vp-link" href="#login-alert">
                [{{ theme.forum.auth.login }}]
              </a>
            </template>
          </DynamicTextReplacer>
        </div>
      </div>
      <div
        class="footer flex justify-between items-center mt-2.5"
        v-show="focused || input?.length > 0"
      >
        <div class="tool"></div>
        <div class="btn flex">
          <Button :disabled="loading" @click="submit()">
            <ReloadIcon class="w-4 h-4 mr-2 animate-spin" v-if="loading" />
            {{ theme.ui.button.submit }}
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
import { useFocus, useTextareaAutosize } from '@vueuse/core'
import { useData } from 'vitepress'
import { useRequest } from 'vue-request'
import { toast } from 'vue-sonner'

const { theme } = useData()

import UserAvatar from '@/components/UserAvatar.vue'

const emit = defineEmits(['comment:submit'])

const {
  number,
  reply = '',
  placeholder = '',
} = defineProps<{
  number: string
  placeholder?: string
  reply?: string
}>()

const userInfo = useUserInfoStore()
const userAuth = useUserAuthStore()

const { textarea, input } = useTextareaAutosize()
const { focused } = useFocus(textarea)

const { data, loading, runAsync, error } = useRequest(issues.postTopicComment, {
  manual: true,
})

const submit = async () => {
  focused.value = true
  if (!userAuth.isTokenValid) location.hash = 'login-alert'
  await runAsync(
    userAuth.accessToken,
    number,
    reply ? reply + ' ' + input.value : input.value,
  )
  if (error.value)
    return toast.error(
      theme.value.forum.comment.commentFail + error.value?.message,
    )

  emit('comment:submit', data)

  input.value = ''
  location.hash = 'reply'
  toast.info(theme.value.forum.comment.commentSuccess)
}
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
