<script setup lang="ts">
interface Props {
  /** 按钮大小 */
  size?: string
  /** 额外的 CSS 类 */
  class?: string
}

withDefaults(defineProps<Props>(), {
  size: '24px',
  class: '',
})

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    :class="$props.class"
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
