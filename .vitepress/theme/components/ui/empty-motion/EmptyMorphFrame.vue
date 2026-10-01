<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSitePreferences } from '~/composables/useSitePreferences'

const props = defineProps<{
  /** 形变标识：变化后紧随的一次内容高度变化做高度过渡；窗口外的被动 reflow（窗口缩放、字体换用）直接就位 */
  morphKey: string | number
}>()

const rootRef = ref<HTMLDivElement>()
const contentRef = ref<HTMLDivElement>()
const { reducedMotion } = useSitePreferences()

const MORPH_WINDOW_MS = 120
const MORPH_DURATION_MS = 380
const MORPH_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)'

let lastHeight: number | undefined
let changedAt = 0
let animation: Animation | undefined
let observer: ResizeObserver | undefined

function settle() {
  const root = rootRef.value
  if (!root)
    return
  root.style.height = ''
  root.style.overflow = ''
}

onMounted(() => {
  const content = contentRef.value
  const root = rootRef.value
  if (!content || !root || typeof ResizeObserver === 'undefined')
    return

  observer = new ResizeObserver(([entry]) => {
    const next = entry.borderBoxSize?.[0]?.blockSize ?? content.offsetHeight
    // 连续形变时以上一动画的实际视觉高度为起点，避免跳变
    const from = animation ? root.getBoundingClientRect().height : lastHeight
    lastHeight = next
    animation?.cancel()
    if (reducedMotion.value || from === undefined || from === next
      || performance.now() - changedAt > MORPH_WINDOW_MS) {
      settle()
      return
    }
    // 动画首帧前先钉住旧高度，避免闪现新布局
    root.style.overflow = 'hidden'
    root.style.height = `${from}px`
    animation = root.animate(
      [{ height: `${from}px` }, { height: `${next}px` }],
      { duration: MORPH_DURATION_MS, easing: MORPH_EASING },
    )
    animation.onfinish = () => {
      animation = undefined
      settle()
    }
  })
  observer.observe(content)
})

watch(() => props.morphKey, () => {
  changedAt = performance.now()
}, { flush: 'post' })

onBeforeUnmount(() => {
  observer?.disconnect()
  animation?.cancel()
})
</script>

<template>
  <div ref="rootRef" class="w-full">
    <div ref="contentRef" class="flex flex-col gap-2 w-full items-center">
      <slot />
    </div>
  </div>
</template>
