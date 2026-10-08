<script setup lang="ts">
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'

interface Props {
  size?: string
  class?: string
  /** 无障碍标签（缺省回落到当前语言的「关闭」） */
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: '24px',
  class: '',
  label: undefined,
})

const emit = defineEmits<{
  click: []
}>()
const { message } = useLocalized()
const ariaLabel = computed(() => props.label ?? message.value.ui?.button?.close ?? 'Close')
</script>

<template>
  <button
    type="button"
    :class="$props.class"
    :aria-label="ariaLabel"
    @click="emit('click')"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      :style="{ width: size, height: size }"
    >
      <path
        d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
      />
    </svg>
  </button>
</template>

<style scoped>
button {
  opacity: 0.7;
  transition: opacity 0.3s cubic-bezier(0.39, 0.575, 0.565, 1);
}

button:hover {
  opacity: 1;
}
</style>
