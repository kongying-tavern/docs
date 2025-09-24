<script lang="ts" setup>
import { useData } from 'vitepress'
import { computed } from 'vue'
import AuthProgressIsland from './AuthProgressIsland.vue'

const { theme } = useData()

const authTexts = computed(() => theme.value.forum.auth.callback)
</script>

<template>
  <div class="callback-page">
    <div class="callback-content">
      <div class="callback-header">
        <h1 class="callback-title">
          {{ authTexts.title }}
        </h1>
        <p class="callback-description">
          {{ authTexts.description }}
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
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 1.5rem 0;
  line-height: 1.2;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.callback-description {
  font-size: 1.25rem;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .callback-page {
    padding: 4rem 1rem 1rem;
  }

  .callback-title {
    font-size: 1.875rem;
    line-height: 1.3;
  }

  .callback-description {
    font-size: 1.125rem;
    line-height: 1.6;
  }

  .callback-header {
    margin-bottom: 2rem;
  }
}

/* 极小屏幕优化 */
@media (max-width: 480px) {
  .callback-page {
    padding: 3rem 0.75rem 1rem;
  }

  .callback-title {
    font-size: 1.5rem;
    line-height: 1.4;
  }

  .callback-description {
    font-size: 1rem;
    line-height: 1.7;
  }
}
</style>
