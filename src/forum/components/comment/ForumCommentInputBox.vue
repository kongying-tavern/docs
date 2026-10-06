<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type RichTextarea from '../form/ForumRichTextarea.vue'
import type ForumAPI from '~/forum/api/types'
import { useMediaQuery } from '@vueuse/core'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { setCommentReply } from '~/forum/services/commentComposer'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/forum/services/forumConfig'
import { ForumPreloadedRichTextarea as ForumRichTextarea, preloadForumRichTextarea } from '../utils/forumComponentPreload'
import { useCommentComposer } from './composables/useCommentComposer'
import { useCommentDraftGuard } from './composables/useCommentDraftGuard'
import ForumCommentComposer from './ForumCommentComposer.vue'
import ForumCommentEditorSkeleton from './ForumCommentEditorSkeleton.vue'
import ForumMobileCommentEntry from './ForumMobileCommentEntry.vue'
import ForumMobileCommentPanel from './ForumMobileCommentPanel.vue'

const props = withDefaults(defineProps<{
  topicId: string
  placeholder?: string[] | string
  replyTarget?: string
  collapse?: boolean
  repo?: ForumAPI.Repo
  class?: HTMLAttributes['class']
  topic?: ForumAPI.Topic
  autofocus?: boolean
  entryAnimation?: boolean
  presentation?: 'page' | 'embedded' | 'inline'
  replyUser?: ForumAPI.User
  mentionUsers?: ForumAPI.User[]
}>(), { placeholder: () => [''], replyTarget: '', collapse: true, repo: 'Feedback', autofocus: false, entryAnimation: true })
const emit = defineEmits<{ 'comment:submit': [comment: ForumAPI.Comment], 'cancel-reply': [], 'editor-open': [open: boolean] }>()

const { message } = useLocalized()
const mobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
const mobileOpen = ref(false)
const mobileEntry = useTemplateRef<InstanceType<typeof ForumMobileCommentEntry>>('mobileEntry')
const entryTool = ref<'emoji' | 'mention' | 'upload' | null>(null)
const pendingTool = ref<'emoji' | 'mention' | 'upload' | null>(null)
const richEditor = useTemplateRef<InstanceType<typeof RichTextarea>>('richEditor')
const { userInfo, userAuth, content, plainText, loading, busy, queue, submitError, submit, addFiles, retryAttachment, maxTextLength } = useCommentComposer(props, (comment) => {
  mobileOpen.value = false
  emit('comment:submit', comment)
})
const hasDraft = computed(() => !!plainText.value.trim() || queue.attachments.value.length > 0)
useCommentDraftGuard(computed(() => hasDraft.value || busy.value), () => message.value.forum.comment.leaveDraft)
const mobilePlaceholder = computed(() => hasDraft.value ? message.value.forum.comment.continueEditing : message.value.forum.comment.placeholder)
async function focusEditor(): Promise<void> {
  await nextTick()
  if (mobileOpen.value && entryTool.value !== 'emoji' && entryTool.value !== 'upload')
    richEditor.value?.focus()
}
function prepareEditor(): void {
  if (userAuth.isTokenValid)
    void preloadForumRichTextarea().catch(() => {})
}
// Wait for the async component and the drawer's Teleport host to mount.
watch(richEditor, async (editor) => {
  if (!editor || !mobileOpen.value)
    return
  await nextTick()
  if (!mobileOpen.value || editor !== richEditor.value)
    return
  if (pendingTool.value) {
    const tool = pendingTool.value
    pendingTool.value = null
    editor.activateTool(tool)
  }
  else {
    await focusEditor()
  }
}, { flush: 'post' })
function open(tool?: 'emoji' | 'mention' | 'upload'): void {
  if (!userAuth.isTokenValid) {
    login()
    return
  }
  entryTool.value = tool ?? null
  pendingTool.value = tool ?? null
  mobileOpen.value = true
  if (tool && richEditor.value) {
    pendingTool.value = null
    richEditor.value.activateTool(tool)
  }
  else if (!tool) {
    void focusEditor()
  }
}
watch(mobileOpen, open => emit('editor-open', open))
watch(() => props.replyUser, (target, previous) => {
  if (!mobile.value || loading.value)
    return
  content.value = setCommentReply(content.value, previous, target)
  if (target)
    open()
})
watch(() => props.autofocus, autofocus => autofocus && mobile.value && open(), { immediate: true })
defineExpose({ open, pending: loading })
function login(): void {
  location.hash = 'login-alert'
}
</script>

<template>
  <template v-if="mobile">
    <ForumMobileCommentEntry
      ref="mobileEntry"
      :label="userAuth.isTokenValid ? mobilePlaceholder : message.forum.comment.loginToComment"
      :disabled="loading"
      :expanded="mobileOpen"
      :tools="presentation === 'page'"
      @prepare="prepareEditor"
      @open="open()"
      @tool="open"
    />
    <ForumMobileCommentPanel v-if="userAuth.isTokenValid" v-model:open="mobileOpen" :embedded="presentation !== 'page'" :pending="loading" :origin="mobileEntry?.element ?? undefined" :reply-user="replyUser" :error="submitError" @cancel-reply="emit('cancel-reply')" @focus-editor="focusEditor">
      <template #default="{ target, active }">
        <!-- Draft and attachments live in the composer; remount DOM to discard closed-dialog aria-hidden state. -->
        <Teleport :to="target ?? 'body'" :disabled="!target">
          <ForumCommentEditorSkeleton v-if="active && target && !richEditor" :mention="entryTool === 'mention'" />
          <ForumRichTextarea
            v-if="active && target"
            ref="richEditor"
            v-model="content"
            mobile borderless
            :active="active"
            :collapse="false"
            :entry-animation="false"
            :attachments="queue.attachments.value"
            :disabled="loading"
            :loading="loading"
            :max-text-length="maxTextLength"
            :placeholders="placeholder"
            :mention-users="mentionUsers"
            :aria-label="message.forum.comment.comment"
            @input="plainText = $event"
            @files-selected="addFiles"
            @remove-attachment="queue.remove"
            @retry-attachment="retryAttachment"
            @submit="submit"
          />
        </Teleport>
      </template>
    </ForumMobileCommentPanel>
  </template>
  <ForumCommentComposer
    v-else
    v-model="content"
    :class="props.class"
    :avatar="userInfo.info?.avatar"
    :username="userInfo.info?.username"
    :authenticated="userAuth.isTokenValid"
    :loading="loading"
    :busy="busy"
    :attachments="queue.attachments.value"
    :collapse="collapse"
    :max-text-length="maxTextLength"
    :autofocus="autofocus"
    :entry-animation="entryAnimation"
    :placeholders="placeholder"
    :reply-target="replyTarget"
    :label="message.forum.comment.comment"
    @input="plainText = $event"
    @files-selected="addFiles"
    @remove-attachment="queue.remove"
    @retry-attachment="retryAttachment"
    @submit="submit"
    @login="login"
  />
</template>
