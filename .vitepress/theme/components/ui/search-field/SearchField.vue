<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, nextTick, onMounted, ref, useId, useTemplateRef } from 'vue'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })
const props = defineProps<{
  label: string
  page?: boolean
  autofocus?: boolean
  hasCriteria?: boolean
  class?: HTMLAttributes['class']
}>()
const emit = defineEmits<{ submit: [], leave: [event: FocusEvent] }>()
const model = defineModel<string>({ required: true })
const expanded = ref(false)
const visible = computed(() => props.page || expanded.value || props.hasCriteria || Boolean(model.value))
const inputId = `search-field-${useId()}`
const root = useTemplateRef<HTMLFormElement>('root')
const input = useTemplateRef<InstanceType<typeof Input>>('input')
let focusing = false

function focus() {
  focusing = true
  expanded.value = true
  nextTick(() => {
    input.value?.focus()
    focusing = false
  })
}

function leave(event: FocusEvent) {
  if (focusing)
    return
  if (event.relatedTarget instanceof Node && root.value?.contains(event.relatedTarget))
    return
  // A selected menu item can unmount before its replacement receives focus.
  // Check the settled focus after Vue has rendered that replacement.
  nextTick(() => {
    if (focusing || root.value?.contains(document.activeElement))
      return
    expanded.value = false
    emit('leave', event)
  })
}

onMounted(() => {
  if (props.autofocus)
    focus()
})

defineExpose({
  focus,
  clear: () => input.value?.clear(),
  contains: (node: Node) => Boolean(root.value?.contains(node)),
})
</script>

<template>
  <form
    ref="root"
    :class="cn('search-field', { 'expanded': visible, 'page-mode': page }, props.class)"
    role="search"
    @submit.prevent="emit('submit')"
    @focusout="leave"
  >
    <button v-if="!visible" type="button" class="search-field-trigger" :aria-label="label" @click="focus">
      <span class="i-lucide-search" aria-hidden="true" />
      <span>{{ label }}</span>
    </button>
    <div v-else class="search-field-control">
      <span class="search-field-icon i-lucide-search" aria-hidden="true" />
      <slot name="prefix" />
      <Input
        :id="inputId"
        ref="input"
        v-model="model"
        v-bind="$attrs"
        type="search"
        class="search-field-input"
        :aria-label="label"
        autocomplete="off"
      />
    </div>
    <slot v-if="visible" />
  </form>
</template>

<style scoped>
.search-field {
  position: relative;
  width: fit-content;
  max-width: 100%;
  interpolate-size: allow-keywords;
  transition: width 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

.search-field.expanded {
  width: clamp(224px, 42vw, 520px);
}

.search-field.page-mode {
  width: 100%;
}

.search-field-trigger,
.search-field-control {
  display: flex;
  align-items: center;
  min-height: 32px;
  border: 1px solid transparent;
  border-radius: 9999px;
  color: var(--vp-c-text-2);
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.search-field-trigger {
  gap: 6px;
  padding: 0 12px 0 10px;
  font-size: calc(12px * var(--site-ui-scale));
  white-space: nowrap;
}

.search-field-trigger:hover {
  background: var(--vp-c-default-soft);
}

.search-field-trigger:focus-visible {
  outline: 2px solid var(--vp-c-text-3);
  outline-offset: 2px;
}

.search-field-control {
  gap: 4px;
  min-width: 0;
  padding-inline: 10px;
  background: var(--vp-c-default-soft);
  animation: search-field-reveal 160ms ease-out;
}

.search-field-control:focus-within {
  border-color: var(--vp-c-text-3);
  box-shadow: none;
}

.search-field-trigger > span:first-child,
.search-field-icon {
  width: 16px;
  height: 16px;
  flex: none;
  pointer-events: none;
}

.search-field :deep(.search-field-input) {
  flex: 1 1 96px;
  width: 0;
  height: 30px;
  min-width: 48px;
  border: 0;
  border-radius: 0;
  padding: 0 4px;
  background: transparent;
  font-size: calc(12px * var(--site-ui-scale));
  box-shadow: none;
  outline: none;
}

.search-field :deep(input::-webkit-search-cancel-button) {
  @apply i-lucide-x;
  appearance: none;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  background-color: var(--vp-c-text-2);
  cursor: pointer;
}

.page-mode .search-field-control {
  min-height: 48px;
  border-color: var(--vp-c-divider);
  border-radius: 12px;
  padding-inline: 14px;
  background: var(--vp-c-bg-elv);
}

.page-mode .search-field-control:focus-within {
  border-color: var(--vp-c-text-3);
}

.page-mode :deep(.search-field-input) {
  height: 46px;
  font-size: calc(15px * var(--site-ui-scale));
}

.page-mode .search-field-icon {
  width: 19px;
  height: 19px;
}

.search-field :deep(.search-field-prefix) {
  display: flex;
  min-width: 0;
  max-width: 65%;
  overflow-x: auto;
  scrollbar-width: none;
}

.search-field :deep(.search-field-token) {
  field-sizing: content;
  box-sizing: content-box;
  min-width: 2ch;
  max-width: 320px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 5px;
  padding: 1px 5px;
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-2);
  font: inherit;
  font-size: calc(12px * var(--site-ui-scale));
  line-height: 20px;
  outline: none;
  transition:
    border-color 120ms ease,
    color 120ms ease;
}

.search-field :deep(.search-field-token:focus-visible) {
  border-color: var(--vp-c-text-3);
  color: var(--vp-c-text-1);
}

@keyframes search-field-reveal {
  from {
    opacity: 0;
    transform: translateX(4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .search-field,
  .search-field-trigger,
  .search-field-control,
  .search-field :deep(.search-field-token) {
    animation: none;
    transition: none;
  }
}
.search-field.page-mode :deep(.search-field-results) {
  position: static;
  width: var(--forum-search-content-width, 100%);
  max-width: none;
  max-height: none;
  overflow: visible;
  margin-top: 12px;
  border: 0;
  border-radius: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.search-field.page-mode :deep(.search-field-result) + :deep(.search-field-result) {
  border-top: 1px solid var(--vp-c-divider);
}

.search-field.page-mode :deep(.search-field-result) {
  min-height: 64px;
  border-radius: 0;
  padding: 10px 12px;
}

.search-field.page-mode :deep(.search-field-result-title) {
  font-size: calc(14px * var(--site-ui-scale));
}

:deep(.search-field-result-state) {
  width: var(--forum-search-content-width, 100%);
  padding: 24px 12px;
  color: var(--vp-c-text-3);
  font-size: calc(13px * var(--site-ui-scale));
  text-align: center;
}

:deep(.search-field-results) {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  width: max(100%, 320px);
  max-width: calc(100vw - 32px);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 6px;
  background: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-3);
  max-height: min(460px, 65vh);
  overflow-y: auto;
}

:deep(.search-field-result) {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 52px;
  border-radius: 6px;
  padding: 7px 10px;
  color: var(--vp-c-text-2);
  text-align: left;
  transition:
    background-color 120ms ease,
    color 120ms ease;
}

:deep(.search-field-result-type) {
  align-self: flex-start;
  margin-top: 4px;
}

:deep(.search-field-result-title) {
  color: var(--vp-c-text-1);
  font-size: calc(13px * var(--site-ui-scale));
  line-height: calc(20px * var(--site-ui-scale));
}

:deep(.search-field-result-excerpt) {
  margin-top: 1px;
  color: var(--vp-c-text-3);
  font-size: calc(12px * var(--site-ui-scale));
  line-height: calc(18px * var(--site-ui-scale));
}

:deep(.search-field-result:hover),
:deep(.search-field-result.active) {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

:deep(.search-field-result:focus-visible) {
  outline: 2px solid var(--vp-c-text-3);
  outline-offset: -2px;
}

@media (prefers-reduced-motion: reduce) {
  :deep(.search-field-result) {
    transition: none;
  }
}
</style>
