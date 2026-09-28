<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { FORM_HASH } from '~/forum/components/form/publish-topic-form/config'
import { useReactionStats } from '~/forum/composables/useReactionStats'
import { useTopicStatusEditor } from '~/forum/composables/useTopicStatusEditor'
import { useTopicTagsEditor } from '~/forum/composables/useTopicTagsEditor'

// 论坛全局对话框的唯一挂载点：平台层布局只渲染本组件，
// 新增对话框在此追加异步组件与状态 composable，平台层零改动。
// 编辑器 chunk 改为入口意图预热（ForumOpenFeedbackFormButton/forumUi.preloadForumPublishForm），
// 不再挂载即预加载。
const ForumPublishTopicForm = defineAsyncComponent(
  () => import('~/forum/components/form/publish-topic-form/ForumPublishTopicForm.vue'),
)
const ForumTopicTagsEditorDialog = defineAsyncComponent(
  () => import('~/forum/components/topic/ForumTopicTagsEditorDialog.vue'),
)
const ForumReactionStatsDialog = defineAsyncComponent(
  () => import('~/forum/components/ui/ForumReactionStatsDialog.vue'),
)
const ForumTopicStatusDialog = defineAsyncComponent(
  () => import('~/forum/components/topic/ForumTopicStatusDialog.vue'),
)
const shouldMountPublishForm = ref(false)
const { open: shouldMountTopicTagsEditor } = useTopicTagsEditor()
const { open: shouldMountReactionStats } = useReactionStats()
const { open: shouldMountTopicStatusEditor } = useTopicStatusEditor()

function mountPublishFormWhenRequested(): void {
  if (location.hash.slice(1).startsWith(FORM_HASH))
    shouldMountPublishForm.value = true
}

onMounted(() => {
  mountPublishFormWhenRequested()
  window.addEventListener('hashchange', mountPublishFormWhenRequested)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', mountPublishFormWhenRequested)
})
</script>

<template>
  <ClientOnly>
    <template v-if="shouldMountPublishForm">
      <ForumPublishTopicForm />
    </template>
    <ForumTopicTagsEditorDialog v-if="shouldMountTopicTagsEditor" />
    <ForumReactionStatsDialog v-if="shouldMountReactionStats" />
    <ForumTopicStatusDialog v-if="shouldMountTopicStatusEditor" />
  </ClientOnly>
</template>
