<script setup lang="ts">
import type { FORUM } from '../types'
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { Image } from '@/components/ui/image'

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
  <div
    v-if="(isCardMode && hasImages) || shouldShowInCompact"
    class="topic-media"
  >
    <!-- Compact Mode - Single Image Preview or Placeholder -->
    <div
      v-if="isCompactMode"
      class="ml-2 mt-1 border border-[var(--vp-c-divider)] rounded-sm flex h-75px min-w-100px transition items-center relative overflow-hidden"
    >
      <Image
        v-if="primaryImage"
        :image="primaryImage"
        class="h-75px w-100px object-cover"
      />

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

    <!-- Card Mode - Natural Image Layout -->
    <div
      v-else-if="isCardMode && hasImages"
      class="topic-content-img mt-2 flex gap-2"
    >
      <Image
        v-for="(image, index) in images"
        :key="index"
        :image="image"
        :thumb-hash="image.thumbHash"
        :width="image.width"
        :height="image.height"
        container-class="!w-auto"
        class="border border-[var(--vp-c-divider)] rounded border-solid h-100px object-cover"
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
  overflow: visible;
}

/* 图片缩放效果 */
.topic-content-img :deep(.VPImage) {
  cursor: zoom-in;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.topic-content-img :deep(.VPImage:hover:not(.no-hover)) {
  border-color: var(--vp-c-brand);
}

/* Compact mode image container */
.relative.ml-2 {
  border-radius: 4px;
  transition: all 0.2s ease;
  border: 1px solid var(--vp-c-divider);
}

.relative.ml-2:hover {
  border-color: var(--vp-c-brand);
}

/* 紧凑模式图片样式 */
.relative.ml-2 :deep(.VPImage) {
  border: none;
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

/* 错误状态样式优化 */
:deep(.VPImage.bg-\[var\(--vp-c-bg-alt\)\]) {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.VPImage.bg-\[var\(--vp-c-bg-alt\)\])::before {
  content: '图片加载失败';
  position: absolute;
  font-size: 12px;
  color: var(--vp-c-text-3);
  pointer-events: none;
}
</style>
