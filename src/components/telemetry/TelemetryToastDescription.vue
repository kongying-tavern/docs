<script setup lang="ts">
import type { Component } from 'vue'
import { computed, isVNode } from 'vue'
import { Button } from '@/components/ui/button'
import ClipboardCopyButton from '@/components/ui/ClipboardCopyButton.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useSitePreferences } from '~/composables/useSitePreferences'
import { useToastDiagnostics } from '~/composables/useToastDiagnostics'
import { formatMessage } from '~/utils/formatMessage'

type DescriptionContent = (() => string | Component) | string | Component

const props = defineProps<{
  /** toast 标题,一并进入复制文本 */
  title?: string | null
  content?: DescriptionContent | null
  contentProps?: Record<string, unknown> | null
  /** 具体报错信息 */
  detail?: string | null
  /** 会话ID与错误ID合并后的追踪标识 */
  traceId?: string | null
}>()

const { message } = useLocalized()
const { desktopUi } = useSitePreferences()
const { openDiagnostics } = useToastDiagnostics()

function isComponent(value: unknown): value is Component {
  return typeof value === 'function'
    || (typeof value === 'object' && value !== null && !isVNode(value))
}

const traceSuffix = computed(() => props.traceId
  ? formatMessage(message.value.forum.telemetry.traceIdSuffix, { traceId: props.traceId })
  : null)

/** 与标题或描述完全相同时不再重复成行 */
const detail = computed(() => {
  const text = props.detail?.trim()
  if (!text)
    return null
  const content = typeof props.content === 'string' ? props.content.trim() : ''
  return text === props.title?.trim() || text === content ? null : text
})

const copyText = computed(() => [
  props.title,
  typeof props.content === 'string' ? props.content : null,
  detail.value,
  traceSuffix.value,
].map(part => part?.trim()).filter(Boolean).join('\n'))
</script>

<template>
  <div class="telemetry-description flex flex-col gap-1 min-w-0" data-clarity-mask="true">
    <div v-if="content" class="telemetry-body">
      <span v-if="typeof content === 'string'" :class="desktopUi ? 'whitespace-pre-wrap break-all' : 'telemetry-content'">{{ content }}</span>
      <component :is="content" v-else-if="isComponent(content)" v-bind="contentProps ?? {}" />
    </div>
    <Button
      v-if="!desktopUi && (detail || traceSuffix)"
      type="button"
      variant="ghost"
      size="sm"
      class="telemetry-details-button"
      :aria-label="message.forum.telemetry.viewErrorDetails"
      @click.stop="openDiagnostics({ title: title ?? message.forum.telemetry.errorDetails, content: copyText }, $event.currentTarget as HTMLElement)"
    >
      {{ message.forum.telemetry.details }}
    </Button>
    <span v-if="desktopUi && detail" class="telemetry-detail">{{ detail }}</span>
    <div v-if="desktopUi && (detail || traceSuffix)" class="telemetry-trace">
      <code v-if="traceSuffix" class="telemetry-trace-text">{{ traceSuffix }}</code>
      <span v-else class="telemetry-trace-gap" aria-hidden="true" />
      <ClipboardCopyButton
        compact
        class="telemetry-trace-copy icon-btn"
        :value="copyText"
        :label="message.forum.telemetry.copyErrorInfo"
        :success-label="message.forum.topic.menu.copyLink.success"
      />
    </div>
  </div>
</template>

<style scoped>
.telemetry-body {
  display: contents;
}

.telemetry-content {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.telemetry-details-button {
  min-height: 44px;
  padding: 8px;
  border-radius: 6px;
  color: var(--vp-c-text-2);
  font-size: inherit;
  cursor: pointer;
}

.telemetry-details-button:focus-visible {
  outline: 2px solid oklch(var(--ring));
  outline-offset: 2px;
}

.telemetry-detail {
  @apply text-ui-12;
  @apply leading-ui-18;
  opacity: 0.75;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.telemetry-trace {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.telemetry-trace-text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  font-family: var(--vp-font-family-mono);
  @apply text-ui-12;
  @apply leading-ui-18;
  opacity: 0.6;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 关闭上报时没有追踪标识,复制按钮单独靠右,保持两种状态下的操作位置一致 */
.telemetry-trace-gap {
  flex: 1 1 auto;
}

.telemetry-trace-copy {
  flex: 0 0 auto;
  border-radius: 6px;
  opacity: 0.6;
}

.telemetry-trace-copy:hover {
  background: var(--vp-c-bg-soft);
  opacity: 1;
}
</style>
