<script setup lang="ts">
import { withBase } from 'vitepress'

import { useI18n } from 'vue-i18n'
import { SITE_LOGO } from '../../locales/common'

defineProps<{ fullscreen?: boolean }>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div class="forum-loading" :class="{ 'forum-loading-fullscreen': fullscreen }" role="status" :aria-label="t('ui.button.loading')" aria-busy="true">
    <img class="forum-loading-logo" :src="withBase(SITE_LOGO)" alt="" width="80" height="80" fetchpriority="high">
  </div>
</template>

<style scoped>
.forum-loading {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--vp-c-bg, #fff);
}

.forum-loading-fullscreen {
  position: fixed;
  z-index: 100;
}

.forum-loading-logo {
  transform: translateY(-24px);
  animation: forum-loading-pulse 2s ease-in-out infinite;
}

@keyframes forum-loading-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.78;
  }
}

html[data-reduced-motion='true'] .forum-loading-logo {
  animation: none;
}
</style>
