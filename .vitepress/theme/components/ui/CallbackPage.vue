<script lang="ts" setup>
import { useRouter, withBase } from 'vitepress'

import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import useLogin from '~/forum/hooks/useLogin'
import AuthProgressIsland from './AuthProgressIsland.vue'

const { t } = useI18n({ useScope: 'global' })

const router = useRouter()
const { hasOAuthCallback } = useLogin()

onMounted(() => {
  // 无回调参数只是误入；正常回调（含到达时已登录）由 useLogin 负责回跳
  if (!hasOAuthCallback)
    router.go(withBase('/'))
})
</script>

<template>
  <div class="callback-page">
    <div class="callback-content">
      <div class="callback-header">
        <h1 class="callback-title">
          {{ t('forum.auth.callback.title') }}
        </h1>
        <p class="callback-description">
          {{ t('forum.auth.callback.description') }}
        </p>
      </div>

      <div class="callback-progress">
        <AuthProgressIsland />
      </div>
    </div>
  </div>
</template>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: var(--vp-c-bg);
  padding: 12rem 2rem 2rem;
}

.callback-content {
  text-align: center;
  max-width: 600px;
  width: 100%;
}

.callback-header {
  margin-bottom: 3rem;
}

.callback-title {
  @apply text-ui-40;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 1.5rem 0;
  line-height: 1.2;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.callback-description {
  @apply text-ui-20;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.callback-progress {
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .callback-page {
    padding: 4rem 1rem 1rem;
  }

  .callback-title {
    @apply text-ui-30;
    line-height: 1.3;
  }

  .callback-description {
    @apply text-ui-18;
    line-height: 1.6;
  }

  .callback-header {
    margin-bottom: 2rem;
  }
}

@media (max-width: 480px) {
  .callback-page {
    padding: 3rem 0.75rem 1rem;
  }

  .callback-title {
    @apply text-ui-24;
    line-height: 1.4;
  }

  .callback-description {
    @apply text-ui-16;
    line-height: 1.7;
  }
}
</style>
