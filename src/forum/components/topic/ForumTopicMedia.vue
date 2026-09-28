<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { computed } from 'vue'
import { useForumViewMode } from '~/forum/composables/useForumViewMode'
import ForumImage from '../ui/ForumImage.vue'

const props = defineProps<{
  topic: ForumAPI.Topic | ForumAPI.Post
}>()

const { isCardMode, isCompactMode } = useForumViewMode(() => props.topic.type)

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

const shouldShowInCompact = computed(() => isCompactMode.value)
</script>

<template>
  <div
    v-if="(isCardMode && hasImages) || shouldShowInCompact"
    data-forum-shared-topic="image"
    class="topic-media"
  >
    <div
      v-if="isCompactMode"
      class="topic-compact-media ml-2 mt-1 border border-[var(--forum-image-outline)] rounded-sm flex h-75px min-w-100px items-center relative overflow-hidden"
    >
      <img
        v-if="primaryImage"
        :src="primaryImage.src"
        :alt="primaryImage.alt || ''"
        class="h-75px w-100px object-cover"
        loading="lazy"
      >

      <div
        v-else
        class="bg-[--vp-c-bg-soft] flex size-full transition-colors duration-200 items-center justify-center hover:bg-[--vp-c-bg-alt]"
      >
        <span class="i-lucide-image text-[var(--vp-c-text-3)] opacity-60" />
      </div>

      <span
        v-if="hasMultipleImages"
        class="font-size-xs text-[var(--forum-media-on-overlay)] p-1 rounded-2px bg-[var(--forum-media-overlay)] flex h-18px items-center right-1 top-1 justify-center absolute"
      >
        <span class="i-lucide-image mr-1 bg-[var(--forum-media-on-overlay)] size-3" />
        {{ imageCount }}
      </span>
    </div>

    <ForumImage
      v-else-if="isCardMode && hasImages"
      layout="row"
      :images="images"
      :max-display="3"
      class="mt-2"
      :context="{
        kind: 'topic',
        topic: props.topic,
        repo: props.topic.type === 'POST' ? 'Blog' : 'Feedback',
        topicAuthorId: props.topic.user.id,
      }"
    />
  </div>
</template>

<style scoped>
.topic-media {
  margin-top: 0.5rem;
}

.topic-compact-media {
  border-radius: 4px;
  transition: border-color 160ms ease;
}

.topic-compact-media:hover {
  border-color: var(--vp-c-brand);
}
</style>
