<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type ForumAPI from '@/apis/forum/api'
import { useMutation } from '@pinia/colada'
import {
  onClickOutside,
} from '@vueuse/core'
import { ref, useTemplateRef, watch } from 'vue'
import { toast } from 'vue-sonner'
import { issues } from '@/apis/forum/gitee'
import UserAvatar from '@/components/UserAvatar.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { VALIDATION_LIMITS } from '../constants'
import ForumRichTextarea from '../form/ForumRichTextarea.vue'

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

const { data, isLoading: loading, mutateAsync: runAsync, error } = useMutation({
  mutation: (params: { repo: ForumAPI.Repo, topicId: string, text: string }) =>
    issues.postTopicComment(params.repo, params.topicId, params.text),
})

const commentInputBoxRef = useTemplateRef('commentInputBox')
const richTextareaRef = useTemplateRef('richTextarea')

// Validation state
const validationError = ref<string | null>(null)

onClickOutside(commentInputBoxRef, () => (hideFooter.value = true))

async function submit(text: string) {
  if (!userAuth.isTokenValid) {
    location.hash = 'login-alert'
    return
  }

  // Validate content before submit
  const trimmedText = text?.trim() || ''
  if (trimmedText.length === 0) {
    validationError.value = message.value.forum.validation.errors.commentEmpty
    toast.error(validationError.value)
    return
  }

  if (trimmedText.length > VALIDATION_LIMITS.CONTENT.MAX_LENGTH) {
    validationError.value = message.value.forum.validation.errors.contentTooLong.replace(
      '{max}',
      String(VALIDATION_LIMITS.CONTENT.MAX_LENGTH),
    )
    toast.error(validationError.value)
    return
  }

  validationError.value = null

  await runAsync({
    repo,
    topicId,
    text,
  })

  emit('comment:submit', data)

  input.value = ''
}

watch(data, (newVal) => {
  if (newVal) {
    toast.success(message.value.forum.comment.commentSuccess)
    // Clear uploaded images after successful comment submission
    richTextareaRef.value?.clearImages?.()
  }
})

watch(error, () => {
  toast.error(message.value.forum.comment.commentFail + error.value?.message)
})

// Clear validation error when input changes
watch(input, () => {
  validationError.value = null
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

    <ForumRichTextarea ref="richTextarea" v-model="input" container-class="w-[calc(100%-80px)] ml-4" :disabled="loading" :placeholders="placeholder" :reply-target="replyTarget" @submit="submit" />
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
