<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'

const { message } = useLocalized()
const failed = ref(false)

// Keep the original rejection: async components must not receive an undefined module.
// Never reload from a speculative prefetch; users may have an unsent draft.
useEventListener('vite:preloadError', () => {
  failed.value = true
})
function reload(): void {
  window.location.reload()
}
</script>

<template>
  <aside v-if="failed" role="alert" class="chunk-load-recovery">
    <p>{{ message.ui.chunkLoadRecovery.description }}</p>
    <div class="flex flex-wrap gap-2">
      <Button type="button" size="sm" @click="reload">
        {{ message.ui.chunkLoadRecovery.reload }}
      </Button>
      <Button type="button" size="sm" variant="outline" @click="failed = false">
        {{ message.ui.chunkLoadRecovery.later }}
      </Button>
    </div>
  </aside>
</template>

<style scoped>
.chunk-load-recovery {
  position: fixed;
  right: 16px;
  bottom: max(16px, env(safe-area-inset-bottom));
  left: 16px;
  z-index: 100;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  max-width: 840px;
  margin-inline: auto;
  padding: 16px;
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-shadow: var(--vp-shadow-3);
}
.chunk-load-recovery p {
  flex: 1 1 320px;
  margin: 0;
  font-size: 14px;
}
</style>
