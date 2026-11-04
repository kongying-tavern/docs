<script setup lang="ts">
import type { JSONContent } from '@tiptap/core'
import type { ImageAttachment } from '~/forum/services/form/imageAttachment'
import { I18nT, useI18n } from 'vue-i18n'
import UserAvatar from '@/components/UserAvatar.vue'
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
const { t } = useI18n({ useScope: 'global' })
const { reducedMotion } = useSitePreferences()
</script>

<template>
  <div class="flex" :class="{ 'content-enter': props.entryAnimation && !reducedMotion }">
    <div class="user-avatar mr-2 flex shrink-0 w-8.5">
      <UserAvatar size="md" class="size-8.5" img-class="size-full" :src="avatar" :alt="username" />
    </div>
    <ForumRichTextarea
      v-if="authenticated"
      v-model="content"
      container-class="min-w-0 flex-1"
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
    <div v-else class="font-size-3.5 line-height-[32px] p-2 text-center rounded-md bg-[var(--vp-c-bg-soft)] flex-1 h-auto min-h-48px min-w-0 cursor-text">
      <I18nT keypath="forum.comment.commentAfterLogin" scope="global" tag="p" class="important:line-height-[32px] important:m-0">
        <template #login>
          <button type="button" class="vp-link" @click="emit('login')">
            [{{ t('forum.auth.login') }}]
          </button>
        </template>
      </I18nT>
    </div>
  </div>
</template>
