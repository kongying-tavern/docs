<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const ForumPublishTopicForm = defineAsyncComponent(
  () => import('~/components/forum/form/publish-topic-form/ForumPublishTopicForm.vue'),
)
</script>

<template>
  <div class="slide-enter Forum">
    <slot />
    <Content />
  </div>
  <ClientOnly>
    <ForumPublishTopicForm />
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
