<script setup lang="ts">
import { CheckIcon, CopyIcon } from '@lucide/vue'
import { useClipboard } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'

const props = defineProps<{
  error: Error
  /** 展示文本；缺省显示 error.message */
  text?: string
}>()

const { message } = useLocalized()
const { copy, copied } = useClipboard({ copiedDuring: 1500 })

const buttonRef = ref<HTMLElement>()
const alignOffset = ref(0)
let resizeObserver: ResizeObserver | undefined

/** 对齐 toast 右侧 action 按钮中线；按当前实际位置累进收敛，避免动画中途测量不准 */
function alignToActionButton(): void {
  const toastEl = buttonRef.value?.closest('[data-sonner-toast]')
  const actionEl = toastEl?.querySelector('[data-button]')
  const button = buttonRef.value
  if (!toastEl || !actionEl || !button)
    return

  function measureDelta(): number {
    const actionRect = actionEl.getBoundingClientRect()
    const buttonRect = button.getBoundingClientRect()
    return (actionRect.top + actionRect.height / 2) - (buttonRect.top + buttonRect.height / 2)
  }

  function converge(attempt = 0): void {
    if (attempt >= 5)
      return
    const delta = measureDelta()
    if (Math.abs(delta) < 0.5)
      return
    alignOffset.value += delta
    requestAnimationFrame(() => converge(attempt + 1))
  }

  converge()
}

onMounted(() => {
  alignToActionButton()
  const toastEl = buttonRef.value?.closest('[data-sonner-toast]')
  if (toastEl) {
    resizeObserver = new ResizeObserver(alignToActionButton)
    resizeObserver.observe(toastEl)
  }
  document.fonts?.ready.then(alignToActionButton).catch(() => {})
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

function buildCopyText(): string {
  const head = `${props.error.name || 'Error'}: ${props.error.message}`
  return props.error.stack ? `${head}\n${props.error.stack}` : head
}
</script>

<template>
  <div class="flex gap-2 items-start justify-between">
    <span class="min-w-0 whitespace-pre-wrap break-all">{{ text ?? error.message }}</span>
    <button
      ref="buttonRef"
      type="button"
      class="icon-btn rounded-md opacity-60 shrink-0 hover:bg-[var(--vp-c-bg-soft)] hover:opacity-100"
      :style="{ marginTop: `${alignOffset}px` }"
      :aria-label="message.forum.publish.feedbackForm.copyError"
      :title="message.forum.publish.feedbackForm.copyError"
      @click.stop="copy(buildCopyText())"
    >
      <CheckIcon v-if="copied" class="text-[var(--vp-c-brand-1)] size-3.5" />
      <CopyIcon v-else class="size-3.5" />
    </button>
  </div>
</template>
