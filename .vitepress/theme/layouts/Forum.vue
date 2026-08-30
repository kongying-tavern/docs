<script setup lang="ts">
import ForumPublishTopicForm from '~/components/forum/form/publish-topic-form/ForumPublishTopicForm.vue'
import ForumTopicTagsEditorDialog from '~/components/forum/topic/ForumTopicTagsEditorDialog.vue'
</script>

<template>
  <div class="slide-enter Forum">
    <slot />
    <Content />
  </div>
  <ForumPublishTopicForm />
  <Teleport to="body">
    <ForumTopicTagsEditorDialog />
  </Teleport>
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
