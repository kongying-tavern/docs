<script setup lang="ts">
import type { FORUM } from '../types'
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { Button } from '@/components/ui/button'
import ForumTopicLifecycle from '../ui/ForumTopicLifecycle.vue'

const { tabs, ariaLabel, layout = 'fill' } = defineProps<{
  tabs: FORUM.ProfileTab[]
  ariaLabel: string
  /** fill：等宽铺满容器（页面主 tab 行）；inline：按内容自适应（折叠吸顶条） */
  layout?: 'fill' | 'inline'
}>()

const activeTab = defineModel<FORUM.ProfileTab['id']>('activeTab', { default: 'all' })

const groupRef = useTemplateRef<HTMLElement>('groupRef')
const indicator = ref({ x: 0, width: 0 })
let resizeObserver: ResizeObserver | null = null

// indicator 尺寸交给 JS 测量：fill/inline 两种布局的按钮宽度规则不同，CSS calc 无法通吃
function syncIndicator(): void {
  const active = groupRef.value?.querySelector<HTMLElement>(`[data-tab-id='${activeTab.value}']`)
  if (!active)
    return
  indicator.value = { x: active.offsetLeft, width: active.offsetWidth }
}

onMounted(() => {
  syncIndicator()
  resizeObserver = new ResizeObserver(syncIndicator)
  if (groupRef.value)
    resizeObserver.observe(groupRef.value)
  void document.fonts?.ready.then(syncIndicator)
})

watch([activeTab, () => tabs], syncIndicator, { flush: 'post' })

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <div
    ref="groupRef"
    role="group"
    :aria-label="ariaLabel"
    :data-layout="layout"
    class="profile-tabs gap-1 min-w-0 relative"
    :class="layout === 'fill' ? 'grid h-12 grid-flow-col auto-cols-fr' : 'flex h-12 items-center'"
  >
    <Button
      v-for="item in tabs"
      :key="item.id"
      :data-tab-id="item.id"
      variant="ghost"
      class="rounded-md min-w-0 whitespace-nowrap self-center relative hover:c-[--vp-c-brand]"
      :class="[layout === 'fill' ? 'w-full' : 'shrink-0 max-sm:flex-1 max-sm:w-0', tabs.length > 2 && 'max-sm:px-2 max-sm:text-xs max-sm:whitespace-normal max-sm:leading-tight', layout === 'inline' && 'max-sm:text-xs']"
      :aria-pressed="activeTab === item.id"
      @click="activeTab = item.id"
    >
      <span class="flex items-center">
        <ForumTopicLifecycle
          v-if="activeTab === item.id"
          :state="item.state"
          icon-only
          class="profile-tab-state-icon"
          aria-hidden="true"
        />
        {{ item.label }}
      </span>
    </Button>
    <span
      class="profile-tab-indicator"
      aria-hidden="true"
      :style="{ transform: `translateX(${indicator.x}px)`, width: `${indicator.width}px` }"
    />
  </div>
</template>

<style scoped>
@container profile-sticky (width < 640px) {
  .profile-tabs[data-layout='inline'] > button {
    flex: 1;
    width: 0;
    padding-inline: 8px;
    font-size: 12px;
    line-height: 1.25;
    white-space: normal;
  }
}

.profile-tab-state-icon {
  --forum-topic-lifecycle-icon-size: 14px;
  margin-inline-end: 6px;
}

.profile-tab-indicator {
  position: absolute;
  bottom: 0;
  height: 0.125rem;
  border-radius: 999px;
  background: var(--vp-c-brand);
  transition:
    transform 210ms cubic-bezier(0.32, 0.72, 0, 1),
    width 210ms cubic-bezier(0.32, 0.72, 0, 1);
  pointer-events: none;
}

html[data-reduced-motion='true'] .profile-tab-indicator {
  transition: none;
}
</style>
