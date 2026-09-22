<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import PageAlertRegion from '@/components/PageAlertRegion.vue'
import { FORM_HASH } from '~/components/forum/form/publish-topic-form/config'
import { useReactionStats } from '~/composables/useReactionStats'
import { useTopicStatusEditor } from '~/composables/useTopicStatusEditor'
import { useTopicTagsEditor } from '~/composables/useTopicTagsEditor'

const loadForumPublishTopicForm = () => import('~/components/forum/form/publish-topic-form/ForumPublishTopicForm.vue')
const ForumPublishTopicForm = defineAsyncComponent(
  loadForumPublishTopicForm,
)
const ForumTopicTagsEditorDialog = defineAsyncComponent(
  () => import('~/components/forum/topic/ForumTopicTagsEditorDialog.vue'),
)
const ForumReactionStatsDialog = defineAsyncComponent(
  () => import('~/components/forum/ui/ForumReactionStatsDialog.vue'),
)
const ForumTopicStatusDialog = defineAsyncComponent(
  () => import('~/components/forum/topic/ForumTopicStatusDialog.vue'),
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
  void loadForumPublishTopicForm().catch(() => undefined)
  mountPublishFormWhenRequested()
  window.addEventListener('hashchange', mountPublishFormWhenRequested)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', mountPublishFormWhenRequested)
})
</script>

<template>
  <div class="slide-enter Forum">
    <div class="forum-alert-slot">
      <PageAlertRegion class="mb-4" />
    </div>
    <slot />
    <Content />
  </div>
  <ClientOnly>
    <template v-if="shouldMountPublishForm">
      <ForumPublishTopicForm />
    </template>
    <ForumTopicTagsEditorDialog v-if="shouldMountTopicTagsEditor" />
    <ForumReactionStatsDialog v-if="shouldMountReactionStats" />
    <ForumTopicStatusDialog v-if="shouldMountTopicStatusEditor" />
  </ClientOnly>
</template>

<style lang="scss" scoped>
.Forum {
  flex-grow: 1;
  flex-shrink: 0;
  margin: calc(var(--vp-layout-top-height, 0px) + 20px) auto 0;
  width: 100%;
  margin-bottom: 32px;
}

/* 与 ForumLayout 的 .forum-container 同一套容器度量，保证告警边缘对齐 */
.forum-alert-slot {
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 1440px) {
  .forum-alert-slot {
    width: min(var(--forum-container-max-width), 100%);
    padding: 0;
  }
}
</style>
