<script setup lang="ts">
import type { Component } from 'vue'
import { computed, isVNode } from 'vue'
import ClipboardCopyButton from '@/components/ui/ClipboardCopyButton.vue'
import { useLocalized } from '@/hooks/useLocalized'
import { formatMessage } from '~/components/forum/utils/forumUi'

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
  <div class="flex flex-col gap-1 min-w-0">
    <span v-if="typeof content === 'string'" class="whitespace-pre-wrap break-all">{{ content }}</span>
    <component :is="content" v-else-if="isComponent(content)" v-bind="contentProps ?? {}" />
    <span v-if="detail" class="telemetry-detail">{{ detail }}</span>
    <div v-if="detail || traceSuffix" class="telemetry-trace">
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
.telemetry-detail {
  font-size: calc(12px * var(--site-ui-scale));
  line-height: calc(18px * var(--site-ui-scale));
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
  font-size: calc(12px * var(--site-ui-scale));
  line-height: calc(18px * var(--site-ui-scale));
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
