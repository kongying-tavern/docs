<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  current: number
  limit: number
  show?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: true,
})

const percentage = computed(() => (props.current / props.limit) * 100)
const isWarning = computed(() => percentage.value > 80)
const isError = computed(() => props.current > props.limit)

const colorClass = computed(() => {
  if (isError.value)
    return 'text-red-500'
  if (isWarning.value)
    return 'text-yellow-500'
  return 'text-gray-500'
})

const progressClass = computed(() => {
  if (isError.value)
    return 'bg-red-500'
  if (isWarning.value)
    return 'bg-yellow-500'
  return 'bg-blue-500'
})
</script>

<template>
  <div v-if="show" class="character-counter flex items-center gap-2 px-3 py-2 text-xs">
    <!-- Progress bar -->
    <div class="h-1 w-16 rounded-full bg-gray-200">
      <div
        class="h-full rounded-full transition-all duration-200"
        :class="progressClass"
        :style="{ width: `${Math.min(percentage, 100)}%` }"
      />
    </div>

    <!-- Counter text -->
    <span :class="colorClass" class="font-mono">
      {{ current }} / {{ limit }}
    </span>
  </div>
</template>

<style scoped>
.character-counter {
  background-color: var(--vp-c-bg-soft);
  border-top: 1px solid var(--vp-c-divider);
  font-size: 0.75rem;
}
</style>
