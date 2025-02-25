<script lang="ts" setup>
import type { DefaultTheme } from 'vitepress/theme-without-fonts'

import { computed } from 'vue'
import Image from './Image.vue'

const { images } = defineProps<{
  images: DefaultTheme.ThemeableImage[]
}>()

const gridClass = computed(() => {
  switch (images.length) {
    case 1:
      return 'grid-cols-1'
    case 2:
      return 'grid-cols-2'
    case 3:
      return 'grid-cols-3 grid-rows-2'
    case 4:
      return 'grid-cols-2 grid-rows-2'
    default:
      return 'grid-cols-4'
  }
})
</script>

<template>
  <div :class="`grid gap-1 max-h-250 ${gridClass}`">
    <div
      v-for="(image, index) in images"
      :key="index"
      class="relative w-full rounded-md rounded-sm"
      :class="{
        'row-span-2 flex flex-col': images.length === 3 && index === 0,
        'col-span-2 row-span-2': images.length === 1,
      }"
    >
      <Image
        class="flex-1 object-cover"
        :class="images.length === 3 && index === 0 ? 'flex-1' : ''"
        :data-image-index="index"
        :image="image"
      />
    </div>
  </div>
</template>
