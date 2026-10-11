<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import AsyncDialogLoading from '~/components/AsyncDialogLoading.vue'
import { defineRecoverableAsyncComponent } from '~/components/defineRecoverableAsyncComponent'
import { FORM_HASH } from '~/forum/components/form/publish-topic-form/form-config'
import { useReactionStats } from '~/forum/composables/data/useReactionStats'
import { useTopicStatusEditor } from '~/forum/composables/state/useTopicStatusEditor'
import { useTopicTagsEditor } from '~/forum/composables/state/useTopicTagsEditor'

// 论坛全局对话框的唯一挂载点：平台层布局只渲染本组件，
// 新增对话框在此追加异步组件与状态 composable，平台层零改动。
// 编辑器 chunk 改为入口意图预热（ForumOpenFeedbackFormButton/forumUi.preloadForumPublishForm），
// 不再挂载即预加载。
const ForumPublishTopicForm = defineRecoverableAsyncComponent(() => import('~/forum/components/form/publish-topic-form/ForumPublishTopicForm.vue'), AsyncDialogLoading)
const ForumTopicTagsEditorDialog = defineRecoverableAsyncComponent(() => import('~/forum/components/topic/ForumTopicTagsEditorDialog.vue'), AsyncDialogLoading)
const ForumReactionStatsDialog = defineRecoverableAsyncComponent(() => import('~/forum/components/ui/ForumReactionStatsDialog.vue'), AsyncDialogLoading)
const ForumTopicStatusDialog = defineRecoverableAsyncComponent(() => import('~/forum/components/topic/ForumTopicStatusDialog.vue'), AsyncDialogLoading)
const shouldMountPublishForm = ref(false)
const { open: shouldMountTopicTagsEditor } = useTopicTagsEditor()
const { open: shouldMountReactionStats } = useReactionStats()
const { open: shouldMountTopicStatusEditor } = useTopicStatusEditor()

function mountPublishFormWhenRequested(): void {
  if (location.hash.slice(1).startsWith(FORM_HASH))
    shouldMountPublishForm.value = true
}

function cancelPendingPublish(): void {
  shouldMountPublishForm.value = false
  if (location.hash.slice(1).startsWith(FORM_HASH))
    location.hash = ''
}

onMounted(mountPublishFormWhenRequested)
useEventListener('hashchange', mountPublishFormWhenRequested)
</script>

<template>
  <template v-if="shouldMountPublishForm">
    <ForumPublishTopicForm @close="cancelPendingPublish" />
  </template>
  <ForumTopicTagsEditorDialog v-if="shouldMountTopicTagsEditor" @close="shouldMountTopicTagsEditor = false" />
  <ForumReactionStatsDialog v-if="shouldMountReactionStats" @close="shouldMountReactionStats = false" />
  <ForumTopicStatusDialog v-if="shouldMountTopicStatusEditor" @close="shouldMountTopicStatusEditor = false" />
</template>
