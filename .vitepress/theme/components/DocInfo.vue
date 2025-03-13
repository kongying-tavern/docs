<script setup lang="ts">
import { useReactionStore } from '@/stores/useReaction'
import dayjs from 'dayjs'
import { useData } from 'vitepress'

const { page, theme, frontmatter } = useData()
const reaction = useReactionStore()
</script>

<template>
  <div v-if="frontmatter.docInfo !== false" class="doc-info">
    <div class="doc-info-left">
      {{ theme.lastUpdatedText }}
      {{ dayjs(page.lastUpdated).format('YYYY-MM-DD') }}
    </div>
    <ClientOnly>
      <div class="doc-info-right flex justify-end text-right font-[var(--vp-font-family-subtitle)]">
        <i i-custom-thumb />
        <div v-if="reaction.loading" class="loader mr-4" />
        <span v-else>
          {{ reaction.currentPageReactionState?.likeCount }}
        </span>
        <i i-custom-thumb ml-2 rotate-180 />
        <div v-if="reaction.loading" class="loader mr-4" />
        <span v-else>
          {{ reaction.currentPageReactionState?.dislikeCount }}
        </span>
      </div>
    </ClientOnly>
  </div>
</template>

<style scoped>
.doc-info {
  display: flex;
  justify-content: space-between;
  grid-row-gap: 4px;

  i {
    display: inline-block;
    width: 24px;
    height: 24px;
    padding-left: 2em;
    fill: currentColor;
  }
}

.doc-info-right {
  justify-content: flex-start;
}

@media (min-width: 640px) {
  .doc-info {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-column-gap: 16px;
  }

  .doc-info-right {
    justify-content: flex-end;
  }
}
</style>
