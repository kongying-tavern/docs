<script lang="ts" setup>
import type { MotionValue } from 'motion-v'
import type { HTMLAttributes } from 'vue'
import { Motion, useScroll, useTransform } from 'motion-v'
import { nextTick, onMounted, ref, watch } from 'vue'

interface Props {
  containerClass?: HTMLAttributes['class']
  class?: HTMLAttributes['class']
  items?: {
    id: string
    label: string
  }[]
  title?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
})

const timelineContainerRef = ref<HTMLElement | null>(null)
const timelineRef = ref<HTMLElement | null>(null)
const height = ref(0)

onMounted(async () => {
  await nextTick()
  if (timelineRef.value) {
    const rect = timelineRef.value.getBoundingClientRect()
    height.value = rect.height
  }
})

const { scrollYProgress } = useScroll({
  target: timelineRef,
  offset: ['start 10%', 'end 50%'],
})

const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1])
const heightTransform = ref<MotionValue<number>>(useTransform(scrollYProgress, [0, 1], [0, 0]))

watch(height, (newHeight) => {
  heightTransform.value = useTransform(scrollYProgress, [0, 1], [0, newHeight])
})
</script>

<template>
  <div
    ref="timelineContainerRef"
    class="w-full bg-white font-sans dark:bg-neutral-950 md:px-10"
  >
    <div
      v-if="title || description"
      class="mx-auto max-w-7xl px-4 py-20 lg:px-10 md:px-8"
    >
      <h2 class="mb-4 max-w-4xl text-center text-4xl text-black md:text-left md:text-6xl dark:text-white">
        {{ title }}
      </h2>
      <p class="subtitle max-w-sm text-center text-sm text-neutral-700 md:text-left md:text-base dark:text-neutral-300">
        {{ description }}
      </p>
    </div>

    <div
      ref="timelineRef"
      class="relative mx-auto max-w-7xl pb-20"
    >
      <div
        v-for="(item, index) in props.items"
        :key="item.id + index"
        class="relative z-1 flex justify-start pt-10 md:gap-10 md:pt-40"
      >
        <div
          className="hidden md:flex z-0 sticky flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full"
        >
          <div
            className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-white dark:bg-black flex items-center justify-center"
          >
            <div
              className="h-4 w-4 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 p-2"
            />
          </div>
          <h3
            className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold text-neutral-500 dark:text-neutral-500 "
          >
            {{ item.label }}
          </h3>
        </div>
        <slot :name="item.id" />
      </div>
      <div
        :style="{
          height: `${height}px`,
        }"
        class="[mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] absolute left-8 top-0 hidden w-[2px] overflow-hidden bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent via-neutral-200 to-transparent from-0% to-99% md:left-8 md:block md:block dark:via-neutral-700"
      >
        <Motion
          as="div"
          :style="{
            height: heightTransform,
            opacity: opacityTransform,
          }"
          class="absolute inset-x-0 top-0 w-[2px] rounded-full from-green-500 via-blue-500 to-transparent from-0% via-10% bg-gradient-to-t"
        />
      </div>
    </div>
  </div>
</template>
