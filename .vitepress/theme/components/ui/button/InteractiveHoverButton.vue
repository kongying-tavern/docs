<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { LoaderCircle } from '@lucide/vue'
import { cn } from '@/lib/utils'

interface Props {
  text?: string
  disabled?: boolean
  /** 加载中：hover 层图标切换为旋转加载圈 */
  loading?: boolean
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  text: 'Button',
  disabled: false,
  loading: false,
})
</script>

<template>
  <button
    type="submit"
    :disabled="props.disabled"
    :class="
      cn(
        'group bg-background relative w-auto cursor-pointer overflow-hidden rounded-full border p-2 px-6 text-center font-semibold',
        props.class,
      )
    "
  >
    <div class="flex gap-2 items-center">
      <div
        class="rounded-lg bg-primary size-2 scale-100 transition-all duration-300 group-hover:scale-[100.8]"
      />
      <span
        class="inline-block whitespace-nowrap transition-all duration-300 group-hover:opacity-0 group-hover:translate-x-12"
      >
        {{ text }}
      </span>
    </div>

    <div
      class="text-primary-foreground opacity-0 flex gap-2 size-full translate-x-12 transition-all duration-300 items-center top-0 justify-center absolute z-10 group-hover:opacity-100 group-hover:-translate-x-5"
    >
      <span class="whitespace-nowrap">{{ text }}</span>
      <LoaderCircle
        v-if="loading"
        class="animate-spin"
        :size="24"
        stroke-width="2"
      />
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-arrow-right"
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </div>
  </button>
</template>

<style></style>
