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
    class="font-sans w-full md:px-10"
  >
    <div
      v-if="title || description"
      class="mx-auto px-4 py-20 max-w-7xl lg:px-10 md:px-8"
    >
      <h2 class="text-4xl c-[var(--vp-c-text-1)] mb-4 text-center max-w-4xl md:text-6xl md:text-left">
        {{ title }}
      </h2>
      <p class="subtitle text-sm c-[var(--vp-c-text-2)] text-center w-full inline-block md:text-base md:text-left md:max-w-sm">
        {{ description }}
      </p>
    </div>

    <div
      ref="timelineRef"
      class="mx-auto pb-20 max-w-7xl relative"
    >
      <div
        v-for="(item, index) in props.items"
        :key="item.id + index"
        class="pt-10 flex justify-start relative z-1 md:pt-40 md:gap-10"
      >
        <div
          class="flex-col max-w-xs hidden items-center self-start top-40 sticky z-0 z-40 md:flex md:flex-row lg:max-w-sm md:w-full"
        >
          <div
            class="rounded-full bg-white flex h-10 w-10 items-center left-3 justify-center absolute dark:bg-black md:left-3"
          >
            <div
              class="p-2 border border-neutral-300 rounded-full bg-neutral-200 h-4 w-4 dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>
          <h3
            class="text-xl c-[var(--vp-c-text-1)] font-bold hidden md:text-2.25rem md:pl-20 md:block"
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
        class="bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] w-[2px] hidden [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] left-8 top-0 absolute overflow-hidden from-transparent to-transparent via-neutral-200 from-0% to-99% md:block md:block md:left-8 dark:via-neutral-700"
      >
        <Motion
          as="div"
          :style="{
            height: heightTransform as unknown as string,
            opacity: opacityTransform,
          }"
          class="rounded-full w-[2px] inset-x-0 top-0 absolute from-green-500 to-transparent via-blue-500 from-0% via-10% bg-gradient-to-t"
        />
      </div>
    </div>
  </div>
</template>
