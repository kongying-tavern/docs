<script lang="ts" setup>
import NumberFlow from '@number-flow/vue'
import { motion, MotionConfig } from 'motion-v'
import { useData } from 'vitepress'
import { computed, onMounted, onUnmounted, ref, useSlots } from 'vue'
import { cn } from '@/lib/utils'
import AnimatedCircularProgressBar from './AnimatedCircularProgressBar.vue'

export interface ProgressStep {
  key: string
  label: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

interface Props {
  class?: string
  title?: string
  height?: number
  mode?: 'scroll' | 'custom'
  customProgress?: number
  steps?: ProgressStep[]
  errorState?: boolean
  onRetry?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  title: 'Progress',
  height: 44,
  mode: 'scroll',
  customProgress: 0,
  steps: () => [],
  errorState: false,
})

const { isDark } = useData()

const open = ref(false)
const slots = useSlots()

const scrollPercentage = ref(0)

const isSlotAvailable = computed(() => !!slots.default || props.steps.length > 0)
const borderRadius = computed(() => `${props.height / 2}px`)

const displayProgress = computed(() => {
  if (props.mode === 'custom') {
    return Math.min(Math.max(props.customProgress, 0), 100)
  }
  return scrollPercentage.value * 100
})

const progressValue = computed(() => {
  if (props.mode === 'custom') {
    return props.customProgress / 100
  }
  return scrollPercentage.value
})

onMounted(() => {
  if (window === undefined || props.mode === 'custom')
    return

  window.addEventListener('scroll', updatePageScroll)
  updatePageScroll()
})

function updatePageScroll() {
  scrollPercentage.value = window.scrollY / (document.body.scrollHeight - window.innerHeight)
}

function handleRetry() {
  if (props.onRetry) {
    props.onRetry()
  }
}

function getStepStatusIcon(status: ProgressStep['status']) {
  switch (status) {
    case 'completed':
      return 'i-lucide:check'
    case 'processing':
      return 'i-lucide:loader'
    case 'failed':
      return 'i-lucide:x'
    default:
      return 'i-lucide:circle'
  }
}

function getStepStatusClass(status: ProgressStep['status']) {
  switch (status) {
    case 'completed':
      return 'text-green-500'
    case 'processing':
      return 'text-blue-500 animate-spin'
    case 'failed':
      return 'text-red-500'
    default:
      return 'text-gray-400'
  }
}

onUnmounted(() => {
  if (props.mode !== 'custom') {
    window.removeEventListener('scroll', updatePageScroll)
  }
})
</script>

<template>
  <MotionConfig
    :transition="{
      duration: 0.7,
      type: 'spring',
      bounce: 0.5,
    }"
  >
    <div
      :class="
        cn(
          'fixed left-1/2 top-12 z-[999] -translate-x-1/2 scroll-island-wrapper backdrop-blur-lg border-radius',
          $props.class,
        )
      "
      @click="() => (open = !open)"
    >
      <motion.div
        id="motion-id"
        layout
        :initial="{
          height: props.height,
          width: 0,
        }"
        :animate="{
          height: open && isSlotAvailable ? 'auto' : props.height,
          width: open && isSlotAvailable ? 320 : 260,
        }"
        class="scroll-island-inner border-radius cursor-pointer relative overflow-hidden"
      >
        <header class="scroll-island-header px-4 flex gap-2 h-11 cursor-pointer items-center">
          <AnimatedCircularProgressBar
            :value="displayProgress"
            :min="0"
            :max="100"
            :circle-stroke-width="10"
            class="w-6"
            :show-percentage="false"
            :duration="0.3"
            :gauge-secondary-color="isDark ? 'rgba(107, 114, 128, 0.33)' : 'rgba(107, 114, 128, 0.6)'"
            :gauge-primary-color="errorState ? 'var(--vp-c-danger-1)' : 'var(--vp-c-brand)'"
          />
          <h1 class="scroll-island-title font-bold text-center grow">
            {{ title }}
          </h1>
          <NumberFlow
            :value="progressValue"
            :format="{ style: 'percent' }"
            locales="en-US"
          />
        </header>
        <motion.div
          v-if="isSlotAvailable"
          class="scroll-island-content text-sm mb-2 px-4 py-2 flex flex-col gap-1 h-full max-h-60 overflow-y-auto"
        >
          <!-- Steps display for custom mode -->
          <div v-if="steps.length > 0" class="space-y-2">
            <div
              v-for="step in steps"
              :key="step.key"
              class="py-1 flex gap-2 items-center"
            >
              <span
                class="h-4 w-4"
                :class="[getStepStatusIcon(step.status), getStepStatusClass(step.status)]"
              />
              <span class="scroll-island-step-label flex-1" :class="step.status === 'completed' ? 'step-completed' : ''">
                {{ step.label }}
              </span>
            </div>

            <!-- Error state with retry button -->
            <div v-if="errorState" class="scroll-island-error pt-2 flex items-center justify-between">
              <span class="text-xs">{{ $props.title }}</span>
              <button
                v-if="onRetry"
                class="scroll-island-retry-btn text-xs px-2 py-1 rounded transition-colors"
                @click="handleRetry"
              >
                Retry
              </button>
            </div>
          </div>

          <!-- Default slot content -->
          <slot v-else />
        </motion.div>
      </motion.div>
    </div>
  </MotionConfig>
</template>

<style scoped>
.border-radius {
  border-radius: v-bind(borderRadius);
}

/* ScrollIsland Inner - Following original bg-natural-900 style */
.scroll-island-inner {
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
}

/* Header - Following original gray- style */
.scroll-island-header {
  border-bottom: 1px solid var(--vp-c-divider);
}

.scroll-island-title {
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
}

/* Content Area */
.scroll-island-content {
  color: var(--vp-c-text-2);
}

/* Step Labels */
.scroll-island-step-label {
  color: var(--vp-c-text-2);
  transition: color 0.2s ease;
}

.step-completed {
  color: var(--vp-c-brand, #44bd87) !important;
  font-weight: 500;
}

/* Error State */
.scroll-island-error {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--vp-c-danger-1, #ef4444);
}

.scroll-island-retry-btn {
  background: var(--vp-c-danger-1, #d73a49);
  color: var(--vp-c-white, #ffffff);
  border: 1px solid var(--vp-c-danger-1, #d73a49);
}

.scroll-island-retry-btn:hover {
  background: var(--vp-c-danger-2, #cb2431);
  border-color: var(--vp-c-danger-2, #cb2431);
}

/* Status Icons */
.text-green-500 {
  color: var(--vp-c-brand, #44bd87);
}

.text-blue-500 {
  color: var(--vp-c-brand-light, #34d399);
}

.text-red-500 {
  color: var(--vp-c-danger-1, #ef4444);
}

.text-gray-400 {
  color: var(--vp-c-text-3);
}
</style>
