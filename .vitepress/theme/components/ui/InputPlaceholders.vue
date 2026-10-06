<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { isArray } from 'lodash-es'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  text: string
  placeholders?: string[] | string
  duration?: number
  align?: 'start' | 'center'
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  placeholders: () => ['Placeholder 1', 'Placeholder 2', 'Placeholder 3'],
  duration: 6000,
  align: 'center',
})

const placeholders = isArray(props.placeholders) ? props.placeholders : [props.placeholders]

const vanishingText = defineModel<string>({
  default: '',
})

const currentPlaceholder = ref<number>(0)
const intervalRef = ref<number | null>(null)

function changePlaceholder(): void {
  intervalRef.value = window.setInterval(() => {
    currentPlaceholder.value = (currentPlaceholder.value + 1) % placeholders.length
  }, props.duration)
}

function handleVisibilityChange(): void {
  if (document.visibilityState !== 'visible' && intervalRef.value) {
    clearInterval(intervalRef.value)
    intervalRef.value = null
  }
  else if (document.visibilityState === 'visible') {
    changePlaceholder()
  }
}

onMounted(() => {
  changePlaceholder()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  if (intervalRef.value) {
    clearInterval(intervalRef.value)
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <ClientOnly>
    <!-- Placeholder Text -->
    <div v-if="props.text.length === 0" data-slot="input-placeholder" class="rounded-full flex pointer-events-none inset-0 absolute" :class="align === 'start' ? 'items-start' : 'items-center'">
      <Transition
        v-show="!vanishingText"
        mode="out-in"
        enter-active-class="transition duration-300 ease-out"
        leave-active-class="transition duration-300 ease-in"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <p
          :key="currentPlaceholder"
          :class="cn('w-[calc(100%-2rem)] truncate text-left text-sm font-normal sm:px-4 sm:text-base color-[var(--vp-c-text-3)]', align === 'start' && 'm-0 px-0 text-base leading-[1.625]', props.class)"
        >
          {{ placeholders[currentPlaceholder] }}
        </p>
      </Transition>
    </div>
  </ClientOnly>
</template>
