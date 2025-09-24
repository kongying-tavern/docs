<script setup lang="ts">
import { Motion } from 'motion-v'
import { computed, ref } from 'vue'

interface Item {
  id: number
  name: string
  designation: string
  image: string
}

defineProps<{
  items: Item[]
}>()

const hoveredIndex = ref<number | null>(null)
const mouseX = ref<number>(0)

// Calculate rotation and translation based on mouse position
const rotation = computed<number>(() => {
  const x = mouseX.value
  return (x / 100) * 50
})

const translation = computed<number>(() => {
  const x = mouseX.value
  return (x / 100) * 50
})

// Handle initial mouse position and hover
function handleMouseEnter(event: MouseEvent, itemId: number) {
  hoveredIndex.value = itemId
  // Calculate initial position immediately
  const rect = (event.target as HTMLElement)?.getBoundingClientRect()
  const halfWidth = rect.width / 2
  mouseX.value = event.clientX - rect.left - halfWidth
}

// Handle mouse movement
function handleMouseMove(event: MouseEvent) {
  const rect = (event.target as HTMLElement)?.getBoundingClientRect()
  const halfWidth = rect.width / 2
  mouseX.value = event.clientX - rect.left - halfWidth
}
</script>

<template>
  <div>
    <div
      v-for="item in items"
      :key="item.id"
      class="group relative -mr-4"
      @mouseenter="(e) => handleMouseEnter(e, item.id)"
      @mouseleave="hoveredIndex = null"
      @mousemove="handleMouseMove"
    >
      <!-- Tooltip -->
      <Motion
        v-if="hoveredIndex === item.id"
        :initial="{
          opacity: 0,
          y: 20,
          scale: 0.6,
        }"
        :animate="{
          opacity: 1,
          y: 0,
          scale: 1,
        }"
        :transition="{
          type: 'spring',
          stiffness: 260,
          damping: 10,
        }"
        :exit="{
          opacity: 0,
          y: 20,
          scale: 0.6,
        }"
        :style="{
          translateX: `${translation}px`,
          rotate: `${rotation}deg`,
        }"
        class="absolute left-1/2 z-50 flex flex-col items-center justify-center whitespace-nowrap rounded-md bg-black px-4 py-2 text-xs shadow-xl -top-16 -translate-x-1/2"
      >
        <div
          class="absolute right-1/2 z-30 me-1 h-px w-2/5 translate-x-1/2 from-transparent via-emerald-500 to-transparent bg-gradient-to-r -bottom-px"
        />
        <div
          class="absolute left-1/2 z-30 ms-1 h-px w-2/5 from-transparent via-sky-500 to-transparent bg-gradient-to-r -bottom-px -translate-x-1/2"
        />
        <div class="relative z-30 text-base text-white font-bold">
          {{ item.name }}
        </div>
        <div class="text-xs text-white">
          {{ item.designation }}
        </div>
      </Motion>

      <!-- Avatar Image -->
      <img
        :src="item.image"
        :alt="item.name"
        class="relative size-14 border-2 border-white rounded-full object-cover object-top transition duration-500 group-hover:z-30 !m-0 group-hover:scale-105 !p-0"
      >
    </div>
  </div>
</template>
