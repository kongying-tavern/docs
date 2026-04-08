<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  name: string
  class?: HTMLAttributes['class']
  icon?: string
  description: string
  href: string
  cta: string
}

const props = defineProps<Props>()
</script>

<template>
  <div
    :key="name"
    :class="
      cn(
        'group relative col-span-3 flex flex-col justify-end overflow-hidden rounded-xl',
        // light styles
        'bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
        // dark styles
        'transform-gpu dark:bg-black dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]',
        props.class,
      )
    "
  >
    <slot name="background" />

    <div
      class="p-6 flex flex-col gap-1 pointer-events-none transform-gpu transition-all duration-300 z-10 group-hover:-translate-y-10"
    >
      <component
        :is="icon"
        v-if="icon"
        class="text-neutral-700 size-12 origin-left transform-gpu transition-all duration-300 ease-in-out group-hover:scale-75"
      />
      <div
        v-else
        class="text-neutral-700 size-12 origin-left transform-gpu transition-all duration-300 ease-in-out group-hover:scale-75"
      />
      <h3 class="text-xl text-neutral-700 font-semibold dark:text-neutral-300">
        {{ name }}
      </h3>
      <p class="text-neutral-400 max-w-lg">
        {{ description }}
      </p>
    </div>

    <div
      class="p-4 opacity-0 flex flex-row w-full pointer-events-none translate-y-10 transform-gpu transition-all duration-300 items-center bottom-0 absolute group-hover:opacity-100 group-hover:translate-y-0"
    >
      <a
        :href="href"
        class="text-sm text-neutral-700 font-medium px-3 py-1.5 rounded-md inline-flex pointer-events-auto transition-colors items-center dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        {{ cta }} →
      </a>
    </div>
    <div
      class="pointer-events-none transform-gpu transition-all duration-300 inset-0 absolute group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10"
    />
  </div>
</template>
