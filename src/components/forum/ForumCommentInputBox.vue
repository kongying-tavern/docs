<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { HTMLAttributes } from 'vue'
import { issues } from '@/apis/forum/gitee'
import UserAvatar from '@/components/UserAvatar.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import {
  onClickOutside,
} from '@vueuse/core'
import { ref, useTemplateRef, watch } from 'vue'
import { useRequest } from 'vue-request'
import { toast } from 'vue-sonner'
import ForumRichTextarea from './ForumRichTextarea.vue'

const {
  topicId,
  replyTarget = '',
  placeholder = [''],
  repo = 'Feedback',
  collapse = true,
} = defineProps<{
  topicId: string
  placeholder?: string[] | string
  replyTarget?: string
  collapse?: boolean
  repo?: ForumAPI.Repo
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits(['comment:submit'])

const input = ref('')
const userInfo = useUserInfoStore()
const userAuth = useUserAuthStore()
const hideFooter = ref(collapse)

const { message } = useLocalized()

const { data, loading, runAsync, error } = useRequest(issues.postTopicComment, {
  manual: true,
})

const commentInputBoxRef = useTemplateRef('commentInputBox')

onClickOutside(commentInputBoxRef, () => (hideFooter.value = true))

async function submit(text: string) {
  if (!userAuth.isTokenValid)
    location.hash = 'login-alert'

  await runAsync(
    repo,
    topicId,
    text,
  )

  emit('comment:submit', data)

  input.value = ''
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
  <div ref="commentInputBox" v-motion-slide-top class="flex" :class="cn('flex', $props.class)">
    <div class="user-avatar mr-2 flex">
      <UserAvatar
        size="md"
        :src="userInfo.info?.avatar"
        :alt="userInfo.info?.username"
      />
    </div>

    <ForumRichTextarea v-model="input" container-class="w-[calc(100%-80px)] ml-4" :disabled="loading" :placeholders="placeholder" :reply-target="replyTarget" @submit="submit" />
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
