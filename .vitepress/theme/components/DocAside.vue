<script setup lang="ts">
import { useLocalized } from '@/hooks/useLocalized'
import { useData, withBase } from 'vitepress'
import { computed } from 'vue'
import DocReaction from './DocReaction.vue'

const { showReaction = true } = defineProps<{
  showReaction?: boolean
}>()

const { theme, page } = useData()
const { formatDate, message } = useLocalized()

const editLink = computed(() => !import.meta.env.DEV
  ? 'https://github.com/kongying-tavern/docs/edit/main/src/:path'.replace(
      /:path/g,
      page.value.filePath,
    )
  : `${window.location.origin}/__open-in-editor?file=${encodeURIComponent(`./src/${page.value.filePath}`)}`,
)

const items = computed(() => {
  return [
    {
      label: import.meta.env.DEV ? '在你的编辑器打开' : message.value.asideLinks.editLink,
      icon: 'i-lucide:square-pen',
      href: editLink.value,
    },
    {
      label: message.value.asideLinks.translateThisPage,
      icon: 'i-lucide:languages',
      href: withBase('_translations'),
    },
  ]
})
</script>

<template>
  <div
    class="hidden border-color-[var(--vp-c-divider)] border-none pt-5 font-[var(--vp-font-family-subtitle)] !mt-5 lg:block space-y-6"
  >
    <div class="space-y-3">
      <div
        class="mb-12 flex shrink-0 flex-col gap-1 text-xs text-color-[var(--vp-c-text-2)] transition-10"
      >
        <p v-if="page?.lastUpdated">
          {{ theme.lastUpdatedText }}
          {{ formatDate(page?.lastUpdated) }}
        </p>

        <VPLink
          v-for="item in items"
          :key="item.label"
          class="flex items-center gap-1.5 underline-offset-2 transition-200 vp-link [&:not(:first-child)]:pt-1 hover:underline"
          :href="item.href"
          rel="noopener noreferrer"
          target="_blank"
          :no-icon="true"
        >
          <span class="h-4 w-4 flex-shrink-0" :class="item.icon" />
          <span>
            {{ item.label }}
          </span>
        </VPLink>
      </div>
      <DocReaction v-if="showReaction" v-motion-slide-right variant="card" />
    </div>
  </div>
</template>
