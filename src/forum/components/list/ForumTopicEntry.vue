<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps<{ delay?: number }>()
const emit = defineEmits<{ entered: [] }>()
const animating = ref(false)
const animationDelay = props.delay ?? 0

onMounted(() => {
  if (props.delay === undefined)
    return
  animating.value = true
  emit('entered')
})
</script>

<template>
  <div class="topic-entry-boundary">
    <div
      :class="{ 'topic-entry-active': animating }"
      :style="{ '--topic-entry-delay': `${animationDelay}ms` }"
      @animationend.self="animating = false"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.topic-entry-boundary {
  overflow-x: clip;
  overflow-clip-margin: 4px;
}

.topic-entry-active {
  animation: topic-entry 420ms cubic-bezier(0.23, 1, 0.32, 1) var(--topic-entry-delay) both;
}

@keyframes topic-entry {
  from {
    transform: translateX(148px);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

html[data-reduced-motion='true'] .topic-entry-active {
  animation: topic-entry-reduced 120ms ease both;
}

@keyframes topic-entry-reduced {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
