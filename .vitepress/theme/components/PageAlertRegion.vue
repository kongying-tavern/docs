<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { OctagonXIcon, TriangleAlertIcon, XIcon } from '@lucide/vue'
import { useRoute } from 'vitepress'
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useLocalized } from '@/hooks/useLocalized'
import { usePageAlertStore } from '@/stores/usePageAlert'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const route = useRoute()
const { message } = useLocalized()
const pageAlert = usePageAlertStore()

const closeLabel = computed(() => message.value.ui?.button?.close ?? 'Close')

onMounted(() => pageAlert.registerRegion())
onBeforeUnmount(() => pageAlert.unregisterRegion())

// 切换路由后旧告警已失去上下文(论坛站内换主题也会改 router path)
watch(() => route.path, () => pageAlert.clear())
</script>

<template>
  <!-- 根节点常驻不 v-if，最后一条才能播完退场动画；空态靠撤掉 margin 类保持零占位 -->
  <TransitionGroup
    tag="div"
    name="page-alert"
    class="page-alert-region flex flex-col gap-2"
    :class="pageAlert.alerts.length > 0 ? props.class : undefined"
  >
    <Alert
      v-for="(item, index) in pageAlert.alerts"
      :key="item.id"
      :variant="item.variant"
      class="pr-9"
      :style="{ '--i': Math.min(index, 5) }"
    >
      <OctagonXIcon v-if="item.variant === 'destructive'" />
      <TriangleAlertIcon v-else />
      <AlertTitle>{{ item.title }}</AlertTitle>
      <AlertDescription v-if="item.description" class="whitespace-pre-wrap break-all" data-clarity-mask="true">
        {{ item.description }}
      </AlertDescription>
      <button
        type="button"
        class="color-[var(--vp-c-text-2)] icon-btn right-1.5 top-1.5 absolute hover:color-[var(--vp-c-text-1)]"
        :aria-label="closeLabel"
        @click="pageAlert.dismiss(item.id)"
      >
        <XIcon class="size-3.5" />
      </button>
    </Alert>
  </TransitionGroup>
</template>

<style scoped>
/* 官方 cva 的配色与描述染色都是后代选择器，class 覆盖会输在权重上，故统一在 :deep 下改写 */
.page-alert-region :deep([data-slot='alert'][data-variant='destructive']) {
  border-color: var(--vp-c-danger-1);
  background-color: var(--vp-c-danger-soft);
}

.page-alert-region :deep([data-slot='alert'][data-variant='destructive'] > svg) {
  color: var(--vp-c-danger-1);
}

.page-alert-region :deep([data-slot='alert'][data-variant='default']) {
  border-color: var(--vp-c-border);
  background-color: var(--vp-c-bg-soft);
}

.page-alert-region :deep([data-slot='alert'][data-variant='default'] > svg) {
  color: var(--vp-c-text-2);
}

/* 红色只留在图标与描边上，标题/描述走中性文字色；同时解除官方的 line-clamp-1 截断 */
.page-alert-region :deep([data-slot='alert-title']) {
  display: block;
  overflow: visible;
  -webkit-line-clamp: unset;
  color: var(--vp-c-text-1);
  font-size: calc(14px * var(--site-ui-scale));
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: normal;
}

.page-alert-region :deep([data-slot='alert-description']) {
  color: var(--vp-c-text-2);
  font-size: calc(13px * var(--site-ui-scale));
  line-height: 1.6;
}

/* 进出场同 ForumTopicList 的 fade：进场竖向自下滑入并错峰，退场只淡出、离场项脱流让下方卡片补位 */
.page-alert-region {
  position: relative;
}

.page-alert-enter-active {
  transition:
    transform 720ms cubic-bezier(0.23, 1, 0.32, 1),
    opacity 720ms cubic-bezier(0.23, 1, 0.32, 1);
  transition-delay: calc(var(--i) * 56ms);
}

.page-alert-enter-from {
  transform: translateY(10px);
  opacity: 0;
}

.page-alert-enter-to {
  transform: translateY(0);
  opacity: 1;
}

.page-alert-leave-active {
  position: absolute;
  width: 100%;
  /* 淡出期间仍覆盖在下一张之上，别让它挡住点击 */
  pointer-events: none;
  transition: opacity 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.page-alert-leave-to {
  opacity: 0;
}

.page-alert-move {
  transition: transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1);
}

@media (prefers-reduced-motion: reduce) {
  .page-alert-enter-active,
  .page-alert-leave-active,
  .page-alert-move {
    transition: none;
  }
}
</style>
