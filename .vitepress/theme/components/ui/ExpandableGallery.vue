<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import Image from './image/Image.vue'

interface Props {
  images: string[]
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="cn('flex h-96 w-full gap-2', props.class)">
    <div
      v-for="image in images"
      :key="image"
      class="rounded-xl flex flex-1 h-full cursor-pointer transition-all duration-500 ease-in-out relative overflow-hidden hover:flex-[3]"
    >
      <Image
        class="h-full relative object-cover"
        :src="image"
        :alt="image"
      />
    </div>
  </div>
</template>
