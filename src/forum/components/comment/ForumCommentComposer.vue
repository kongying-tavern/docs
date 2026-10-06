<script setup lang="ts">
import type { JSONContent } from '@tiptap/core'
import type { ImageAttachment } from '~/forum/services/form/imageAttachment'
import { computed } from 'vue'
import DynamicTextReplacer from '@/components/ui/DynamicTextReplacer.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { ForumPreloadedRichTextarea as ForumRichTextarea } from '../utils/forumComponentPreload'

const props = defineProps<{
  avatar?: string
  username?: string
  authenticated: boolean
  loading: boolean
  busy: boolean
  attachments: ImageAttachment[]
  collapse: boolean
  maxTextLength: number
  autofocus: boolean
  entryAnimation: boolean
  placeholders: string[] | string
  replyTarget: string
  label: string
}>()

const emit = defineEmits<{
  'input': [value: string]
  'files-selected': [files: File[]]
  'remove-attachment': [id: string]
  'retry-attachment': [id: string]
  'submit': []
  'login': []
}>()

const content = defineModel<JSONContent>({ required: true })
const { message } = useLocalized()
const { reducedMotion } = useSitePreferences()
const entryMotion = computed(() => (props.entryAnimation && !reducedMotion.value
  ? { initial: { y: -24, opacity: 0 }, enter: { y: 0, opacity: 1 } }
  : {}))
</script>

<template>
  <div v-motion :initial="entryMotion.initial" :enter="entryMotion.enter" class="flex">
    <div class="user-avatar mr-2 flex w-[64px]">
      <UserAvatar size="lg" :src="avatar" :alt="username" />
    </div>
    <ForumRichTextarea
      v-if="authenticated"
      v-model="content"
      container-class="w-[calc(100%-72px)]"
      :attachments="attachments"
      :disabled="loading"
      :loading="busy"
      :collapse="collapse"
      :max-text-length="maxTextLength"
      :autofocus="autofocus"
      :entry-animation="entryAnimation"
      :placeholders="placeholders"
      :reply-target="replyTarget"
      :aria-label="label"
      @input="emit('input', $event)"
      @files-selected="emit('files-selected', $event)"
      @remove-attachment="emit('remove-attachment', $event)"
      @retry-attachment="emit('retry-attachment', $event)"
      @submit="emit('submit')"
    />
    <div v-else class="font-size-3.5 line-height-[32px] ml-4 p-2 text-center rounded-md bg-[var(--vp-c-bg-soft)] h-auto min-h-48px w-[calc(100%-80px)] cursor-text">
      <DynamicTextReplacer :data="message.forum.comment.commentAfterLogin" class="important:line-height-[32px] important:m-0">
        <template #login>
          <button type="button" class="vp-link" @click="emit('login')">
            [{{ message.forum.auth.login }}]
          </button>
        </template>
      </DynamicTextReplacer>
    </div>
  </div>
</template>
