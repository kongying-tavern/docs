<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { flattenWithTags } from '../utils/forumUi'

const { theme } = useData()
const { message } = useLocalized()
const copy = computed(() => message.value.forum.aside.suggest)

const recommendedDocs = computed(() => {
  const sidebarDocs = flattenWithTags(
    Object.values(theme.value.sidebar).flat().filter(item => item.text),
  ).filter(item => item.text.trim() !== item.tag.trim())
  const firstBySection = new Map<string, typeof sidebarDocs[number]>()
  for (const item of sidebarDocs) {
    if (!firstBySection.has(item.tag))
      firstBySection.set(item.tag, item)
  }

  const candidates = [...copy.value.items, ...firstBySection.values(), ...sidebarDocs]
  return candidates.filter((item, index) =>
    item.link && candidates.findIndex(candidate => candidate.link === item.link) === index,
  ).slice(0, 6)
})

const TAG_WRAPPER_PATTERN = /[【】[\]]/g

function cleanLabel(text: string): string {
  return text.replace(TAG_WRAPPER_PATTERN, ' ').trim()
}
</script>

<template>
  <div class="selected-articles mb-4">
    <p class="color-[var(--vp-c-text-1)] lh-14 font-[var(--vp-font-family-subtitle)] mb-4 vp-border-divider h-14">
      {{ copy.text }}
    </p>
    <VPLink
      v-for="item in recommendedDocs"
      :key="item.link"
      :href="item.link"
      class="forum-aside-list-item forum-aside-document-item"
    >
      <span v-if="item.tag" class="font-size-3.5 color-[--vp-c-text-3] line-height-[24px] mr-3 break-keep">
        [{{ cleanLabel(item.tag) }}]
      </span>
      <span class="forum-aside-document-title font-size-3.5 color-[--vp-c-text-2] lh-6 min-w-0 overflow-hidden line-clamp-2">
        {{ cleanLabel(item.text) }}
      </span>
    </VPLink>
  </div>
</template>

<style scoped>
.forum-aside-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  padding: 6px 8px;
}

.forum-aside-list-item:hover .forum-aside-document-title {
  color: var(--vp-c-brand-1);
}

.forum-aside-document-item {
  align-items: flex-start;
  text-align: left;
}
</style>
