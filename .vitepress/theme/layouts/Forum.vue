<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { FORM_HASH } from '~/components/forum/form/publish-topic-form/config'
import { useTopicTagsEditor } from '~/composables/useTopicTagsEditor'

const loadForumPublishTopicForm = () => import('~/components/forum/form/publish-topic-form/ForumPublishTopicForm.vue')
const ForumPublishTopicForm = defineAsyncComponent(
  loadForumPublishTopicForm,
)
const ForumTopicTagsEditorDialog = defineAsyncComponent(
  () => import('~/components/forum/topic/ForumTopicTagsEditorDialog.vue'),
)
const shouldMountPublishForm = ref(false)
const { open: shouldMountTopicTagsEditor } = useTopicTagsEditor()

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
    <slot />
    <Content />
  </div>
  <ClientOnly>
    <template v-if="shouldMountPublishForm">
      <ForumPublishTopicForm />
    </template>
    <ForumTopicTagsEditorDialog v-if="shouldMountTopicTagsEditor" />
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
</style>
