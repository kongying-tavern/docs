<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import AsyncDialogLoading from '@/src/components/async/AsyncDialogLoading.vue'
import { defineRecoverableAsyncComponent } from '@/src/components/async/defineRecoverableAsyncComponent.ts'
import { FORM_HASH } from '@/src/forum/components/form/publish-topic-form/form-config.ts'
import ForumPublishTopicLoading from '@/src/forum/components/form/publish-topic-form/ForumPublishTopicLoading.vue'
import { useReactionStats } from '@/src/forum/hooks/data/useReactionStats.ts'
import { useForumImageMetadata } from '@/src/forum/hooks/state/useForumImageMetadata.ts'
import { useTopicStatusEditor } from '@/src/forum/hooks/state/useTopicStatusEditor.ts'
import { useTopicTagsEditor } from '@/src/forum/hooks/state/useTopicTagsEditor.ts'

// 论坛全局对话框的唯一挂载点：平台层布局只渲染本组件，
// 新增对话框在此追加异步组件与状态 composable，平台层零改动。
// 编辑器 chunk 改为入口意图预热（ForumOpenFeedbackFormButton/forumUi.preloadForumPublishForm），
// 不再挂载即预加载。
const ForumPublishTopicForm = defineRecoverableAsyncComponent(() => import('@/src/forum/components/form/publish-topic-form/ForumPublishTopicForm.vue'), ForumPublishTopicLoading)
const ForumTopicTagsEditorDialog = defineRecoverableAsyncComponent(() => import('@/src/forum/components/topic/ForumTopicTagsEditorDialog.vue'), AsyncDialogLoading)
const ForumReactionStatsDialog = defineRecoverableAsyncComponent(() => import('@/src/forum/components/ui/ForumReactionStatsDialog.vue'), AsyncDialogLoading)
const ForumTopicStatusDialog = defineRecoverableAsyncComponent(() => import('@/src/forum/components/topic/ForumTopicStatusDialog.vue'), AsyncDialogLoading)
const ForumImageMetadataDialog = defineRecoverableAsyncComponent(() => import('@/src/forum/components/ui/ForumImageMetadataDialog.vue'), AsyncDialogLoading)
const { open: shouldMountImageMetadata } = useForumImageMetadata()
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
  <ForumImageMetadataDialog v-if="shouldMountImageMetadata" />
  <ForumTopicStatusDialog v-if="shouldMountTopicStatusEditor" @close="shouldMountTopicStatusEditor = false" />
</template>
