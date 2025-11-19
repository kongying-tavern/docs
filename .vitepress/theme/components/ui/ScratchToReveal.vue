<script lang="ts" setup>
import type { Ref } from 'vue'
import { useResizeObserver, watchOnce } from '@vueuse/core'
import { Motion, useAnimate } from 'motion-v'
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: string
  width?: number
  height?: number
  minScratchPercentage?: number
  gradientColors?: [string, string, string]
}

const props = withDefaults(defineProps<Props>(), {
  gradientColors: () => ['#cfd9df', '#e2ebf0', '#f5f9fc'],
  minScratchPercentage: 50,
})

const emit = defineEmits<{
  complete: []
}>()

const cursorImg
  = 'url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4KICA8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNSIgc3R5bGU9ImZpbGw6I2ZmZjtzdHJva2U6IzAwMDtzdHJva2Utd2lkdGg6MXB4OyIgLz4KPC9zdmc+\'), auto'

const canvasRef = ref<HTMLCanvasElement>()
const slot = useTemplateRef('slot')

const autoHeight = ref(0)
const autoWidth = ref(0)

const isScratching = ref(false)
const isComplete = ref(false)

useResizeObserver(slot, (entries) => {
  const entry = entries[0]
  const { width, height } = entry.contentRect

  autoWidth.value = Math.ceil(width) + 12
  autoHeight.value = Math.ceil(height) + 8
})

const context = ref<CanvasRenderingContext2D>()

const cursorStyle = computed(() =>
  isComplete.value ? 'auto' : cursorImg,
)

function handleMouseDown() {
  isScratching.value = true
}
function handleTouchStart() {
  isScratching.value = true
}

const canvasWidth = computed(() => canvasRef.value?.width || autoWidth.value || props.width!)
const canvasHeight = computed(() => canvasRef.value?.height || autoHeight.value || props.height!)

function drawCanvas(canvasRef: Ref<HTMLCanvasElement>) {
  context.value = canvasRef.value.getContext('2d')!
  context.value.fillStyle = '#ccc'
  context.value.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
  const gradient = context.value.createLinearGradient(0, 0, canvasWidth.value, canvasHeight.value)
  gradient.addColorStop(0, props.gradientColors[0])
  gradient.addColorStop(0.5, props.gradientColors[1])
  gradient.addColorStop(1, props.gradientColors[2])
  context.value.fillStyle = gradient
  context.value.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
}

function scratch(clientX: number, clientY: number) {
  if (canvasRef.value && context.value) {
    const rect = canvasRef.value.getBoundingClientRect()
    const x = clientX - rect.left + 16
    const y = clientY - rect.top + 16

    context.value.globalCompositeOperation = 'destination-out'
    context.value.beginPath()
    context.value.arc(x, y, 30, 0, Math.PI * 2)
    context.value.fill()
  }
}

function handleDocumentMouseMove(event: MouseEvent) {
  if (!isScratching.value)
    return
  scratch(event.clientX, event.clientY)
}

function handleDocumentTouchMove(event: TouchEvent) {
  if (!isScratching.value)
    return
  const touch = event.touches[0]
  scratch(touch.clientX, touch.clientY)
}

function handleDocumentMouseUp() {
  isScratching.value = false
  checkCompletion()
}
function handleDocumentTouchEnd() {
  isScratching.value = false
  checkCompletion()
}

function addEventListeners() {
  document.addEventListener('mousedown', handleDocumentMouseMove)
  document.addEventListener('mousemove', handleDocumentMouseMove)
  document.addEventListener('touchstart', handleDocumentTouchMove)
  document.addEventListener('touchmove', handleDocumentTouchMove)
  document.addEventListener('mouseup', handleDocumentMouseUp)
  document.addEventListener('touchend', handleDocumentTouchEnd)
  document.addEventListener('touchcancel', handleDocumentTouchEnd)
}

function checkCompletion() {
  if (isComplete.value)
    return

  if (canvasRef.value && context.value) {
    const imageData = context.value.getImageData(0, 0, canvasWidth.value, canvasHeight.value)
    const pixels = imageData.data
    const totalPixels = pixels.length / 4
    let clearPixels = 0

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        clearPixels++
      }
    }

    const percentage = (clearPixels / totalPixels) * 100

    if (percentage >= props.minScratchPercentage) {
      isComplete.value = true
      context.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value)

      startAnimation()
    }
    else {
      isScratching.value = false
    }
  }
}

const [containerRef] = useAnimate()

async function startAnimation() {
  if (!containerRef.value)
    return

  emit('complete')
}

onMounted(() => {
  addEventListeners()
})

watchOnce(
  () => autoWidth.value > 0 && autoHeight.value > 0,
  async () => {
    if (!canvasRef.value)
      return
    canvasRef.value.width = autoWidth.value
    canvasRef.value.height = autoHeight.value
    drawCanvas(canvasRef as Ref<HTMLCanvasElement>)
  },
)

function removeEventListeners() {
  document.removeEventListener('mousedown', handleDocumentMouseMove)
  document.removeEventListener('mousemove', handleDocumentMouseMove)
  document.removeEventListener('touchstart', handleDocumentTouchMove)
  document.removeEventListener('touchmove', handleDocumentTouchMove)
  document.removeEventListener('mouseup', handleDocumentMouseUp)
  document.removeEventListener('touchend', handleDocumentTouchEnd)
  document.removeEventListener('touchcancel', handleDocumentTouchEnd)
}
onUnmounted(() => {
  removeEventListeners()
})
</script>

<template>
  <ClientOnly>
    <Motion
      ref="containerRef"
      :class="cn('relative inline-flex', props.class)"
      :style="{
        width: '100%',
        height: '100%',
        cursor: cursorStyle,
        opacity: slot ? 1 : 0,
        userSelect: isComplete ? 'auto' : 'none',
      }"
      :transition="{ duration: 0.5 }"
    >
      <canvas
        v-show="!isComplete"
        ref="canvasRef"
        class="absolute left-0 top-0"
        :style="{ width: `${autoWidth}px`, height: `${autoHeight}px`, pointerEvents: isComplete ? 'none' : 'auto' }"
        @mousedown="handleMouseDown"
        @touchstart="handleTouchStart"
      />
      <div
        ref="slot"
        class="inline-block h-auto max-w-full py-2"
      >
        <slot />
      </div>
    </Motion>
  </ClientOnly>
</template>
