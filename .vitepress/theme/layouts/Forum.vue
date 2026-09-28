<script setup lang="ts">
import PageAlertRegion from '@/components/PageAlertRegion.vue'
import ForumGlobalDialogs from '~/forum/components/layout/ForumGlobalDialogs.vue'
</script>

<template>
  <div class="slide-enter Forum">
    <div class="forum-alert-slot">
      <PageAlertRegion class="mb-4" />
    </div>
    <slot />
    <Content />
  </div>
  <ForumGlobalDialogs />
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
