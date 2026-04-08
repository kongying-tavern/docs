<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { useForumViewMode } from '~/composables/useForumViewMode'
import ForumImage from '../ui/ForumImage.vue'

const props = defineProps<{
  topic: ForumAPI.Topic | ForumAPI.Post
}>()

const { isCardMode, isCompactMode } = useForumViewMode()

// Computed properties
const hasImages = computed(() =>
  props.topic.content?.images && props.topic.content.images.length > 0,
)

const images = computed(() => {
  const imgs = props.topic.content?.images || []
  return imgs.map(img => ({
    src: img.src,
    alt: img.alt || '',
    width: img.width,
    height: img.height,
    thumbHash: img.thumbHash,
  }))
})

const primaryImage = computed(() => images.value[0])

const imageCount = computed(() => images.value.length)
const hasMultipleImages = computed(() => imageCount.value > 1)

// Compact mode always shows media area
const shouldShowInCompact = computed(() => isCompactMode.value)
</script>

<template>
  <div
    v-if="(isCardMode && hasImages) || shouldShowInCompact"
    class="topic-media"
  >
    <!-- Compact Mode - Single Image Preview or Placeholder -->
    <div
      v-if="isCompactMode"
      class="ml-2 mt-1 border border-[var(--vp-c-divider)] rounded-sm flex h-75px min-w-100px transition items-center relative overflow-hidden"
    >
      <img
        v-if="primaryImage"
        :src="primaryImage.src"
        :alt="primaryImage.alt || ''"
        class="h-75px w-100px object-cover"
        loading="lazy"
      >

      <!-- Placeholder for topics without images -->
      <div
        v-else
        class="bg-[--vp-c-bg-soft] flex size-full transition-colors duration-200 items-center justify-center hover:bg-[--vp-c-bg-alt]"
      >
        <span class="i-lucide-image text-[var(--vp-c-text-3)] opacity-60" />
      </div>

      <!-- Multiple Images Indicator for Compact Mode -->
      <span
        v-if="hasMultipleImages"
        class="font-size-xs c-white p-1 rounded-2px bg-[rgba(0,0,0,.5)] flex h-18px items-center right-1 top-1 justify-center absolute"
      >
        <span class="i-lucide-image mr-1 bg-white size-3" />
        {{ imageCount }}
      </span>
    </div>

    <!-- Card Mode - Use ForumImage with row layout -->
    <ForumImage
      v-else-if="isCardMode && hasImages"
      layout="row"
      :images="images"
      :max-display="3"
      class="mt-2"
    />
  </div>
</template>

<style scoped>
.topic-media {
  margin-top: 0.5rem;
}

/* Compact mode image container */
.ml-2 {
  border-radius: 4px;
  transition: all 0.2s ease;
  border: 1px solid var(--vp-c-divider);
}

.ml-2:hover {
  border-color: var(--vp-c-brand);
}

/* Multiple images indicator animation */
.absolute.bottom-1 {
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
