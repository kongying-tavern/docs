<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { useRouter } from 'vitepress'

interface Props {
  class?: HTMLAttributes['class']
  to?: string
}

const props = defineProps<Props>()
const router = useRouter()

function handleClick() {
  router.go(props.to)
}
</script>

<template>
  <div
    :class="
      cn(
        'cursor-pointer row-span-1 rounded-xl group/bento transition duration-200 shadow-input dark:shadow-none p-4 border border-transparent justify-between flex flex-col space-y-4',
        props.class,
      )
    "
    @click="handleClick"
  >
    <slot name="header" />
    <div class="transition duration-200">
      <slot name="icon" />
      <div class="my-2 c-[var(--vp-c-text-1)] font-bold font-sans">
        <slot name="title" />
      </div>
      <div class="text-xs c-[var(--vp-c-text-2)] font-normal font-sans">
        <slot name="description" />
      </div>
    </div>
  </div>
</template>
