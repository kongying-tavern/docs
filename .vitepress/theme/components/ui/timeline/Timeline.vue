<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { Motion, useScroll, useTransform } from 'motion-v'
import { ref } from 'vue'

interface Props {
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

const timelineRef = ref<HTMLElement | null>(null)

const { scrollYProgress } = useScroll({
  target: timelineRef,
  offset: ['start 10%', 'end 50%'],
})

const fillHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
const fillOpacity = useTransform(scrollYProgress, [0, 0.12], [0, 1])
</script>

<template>
  <div
    class="font-sans w-full md:px-10"
  >
    <div
      v-if="title || description"
      class="mx-auto px-4 py-20 max-w-7xl lg:px-10 md:px-8"
    >
      <h2 class="text-4xl c-[var(--vp-c-text-1)] font-[var(--vp-font-family-title)] mb-4 text-center max-w-4xl md:text-6xl md:text-left">
        {{ title }}
      </h2>
      <p class="subtitle text-sm c-[var(--vp-c-text-2)] text-center w-full inline-block md:text-base md:text-left md:max-w-sm">
        {{ description }}
      </p>
    </div>

    <div
      ref="timelineRef"
      class="timeline-body mx-auto pb-20 max-w-7xl relative"
    >
      <div
        v-for="(item, index) in props.items"
        :key="item.id + index"
        class="pt-10 flex justify-start relative z-1 md:pt-40 md:gap-10"
      >
        <div
          class="max-w-xs items-center self-start top-40 sticky z-40 hidden md:flex lg:max-w-sm md:w-full"
        >
          <div class="timeline-dot-mask" aria-hidden="true">
            <div class="timeline-dot-bead" />
          </div>
          <h3
            class="text-xl c-[var(--vp-c-text-1)] font-bold md:text-2.25rem md:pl-20"
          >
            {{ item.label }}
          </h3>
        </div>
        <slot :name="item.id" />
      </div>
      <div class="timeline-rail" aria-hidden="true">
        <Motion
          class="timeline-rail-fill"
          :style="{
            height: fillHeight,
            opacity: fillOpacity,
          }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-body {
  --timeline-rail-center: 33px;
}

.timeline-rail {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--timeline-rail-center) - 1px);
  display: none;
  width: 2px;
  background-image: linear-gradient(
    to bottom,
    transparent,
    var(--vp-c-divider) 24px,
    var(--vp-c-divider) calc(100% - 24px),
    transparent
  );
  clip-path: polygon(50% 0, 100% 6px, 100% calc(100% - 6px), 50% 100%, 0 calc(100% - 6px), 0 6px);
}

.timeline-rail-fill {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  border-radius: 9999px;
  background-image: linear-gradient(
    to top,
    color-mix(in srgb, var(--vp-c-brand-1) 80%, var(--vp-c-bg)),
    color-mix(in srgb, var(--vp-c-brand-1) 45%, var(--vp-c-bg))
  );
}

.timeline-dot-mask {
  position: absolute;
  left: var(--timeline-rail-center);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  background-color: var(--vp-c-bg);
  transform: translateX(-50%);
}

.timeline-dot-bead {
  width: 12px;
  height: 12px;
  border: 1px solid var(--vp-c-border);
  border-radius: 9999px;
  background-color: var(--vp-c-divider);
}

@media (min-width: 768px) {
  .timeline-rail {
    display: block;
  }
}
</style>
