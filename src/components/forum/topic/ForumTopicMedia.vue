<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { FORUM } from './types'
import { Image } from '@/components/ui/image'
import { computed } from 'vue'

interface Props {
  topic: ForumAPI.Topic | ForumAPI.Post
  viewMode: FORUM.TopicViewMode
}

const props = defineProps<Props>()

// Computed properties
const hasImages = computed(() =>
  props.topic.content?.images && props.topic.content.images.length > 0,
)

const isCompactMode = computed(() => props.viewMode === 'Compact')
const isCardMode = computed(() => props.viewMode === 'Card')

const images = computed(() => props.topic.content?.images || [])
const primaryImage = computed(() => images.value[0])
const imageCount = computed(() => images.value.length)
const hasMultipleImages = computed(() => imageCount.value > 1)

// Compact mode always shows media area
const shouldShowInCompact = computed(() => isCompactMode.value)
</script>

<template>
  <div v-if="(isCardMode && hasImages) || shouldShowInCompact" class="topic-media">
    <!-- Compact Mode - Single Image Preview or Placeholder -->
    <div
      v-if="isCompactMode"
      class="relative ml-2 mt-1 h-75px min-w-100px flex items-center overflow-hidden border border-[var(--vp-c-divider)] rounded-sm transition"
    >
      <Image
        v-if="primaryImage"
        :src="primaryImage.src"
        :alt="primaryImage.alt"
        :thumb-hash="primaryImage.thumbHash"
        :width="primaryImage.width"
        :height="primaryImage.height"
        class="h-75px w-100px object-cover"
        loading="lazy"
      />

      <!-- Placeholder for topics without images -->
      <div
        v-else
        class="size-full flex items-center justify-center bg-[--vp-c-bg-soft]"
      >
        <span class="i-lucide-square-menu text-[var(--vp-c-text-3)]" />
      </div>

      <!-- Multiple Images Indicator -->
      <span
        v-if="hasMultipleImages"
        class="absolute bottom-1 right-1 h-18px flex items-center justify-center rounded-2px bg-[rgba(0,0,0,.5)] p-1 font-size-xs c-white"
      >
        <span class="i-lucide-image mr-1 size-3 bg-white" />
        {{ imageCount }}
      </span>
    </div>

    <!-- Card Mode - Full Image Gallery -->
    <div
      v-else-if="isCardMode && hasImages"
      class="topic-content-img mt-2 flex cursor-pointer"
    >
      <Image
        v-for="(img, index) in images"
        :key="img.src"
        :src="img.src"
        :alt="img.alt"
        :thumb-hash="img.thumbHash"
        :width="img.width"
        :height="img.height"
        :preload="true"
        class="mr-4 max-h-30 max-w-30 min-h-22 min-w-22 rounded-sm object-cover"
      />
    </div>
  </div>
</template>

<style scoped>
.topic-media {
  margin-top: 0.5rem;
}

.topic-content-img {
  max-height: 120px;
  overflow: hidden;
}

.topic-content-img img {
  cursor: zoom-in;
}

/* Compact mode image container */
.relative.ml-2 {
  border-radius: 4px;
  transition: all 0.2s ease;
}

.relative.ml-2:hover {
  transform: translateY(-1px);
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
