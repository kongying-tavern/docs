<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DocReaction from './DocReaction.vue'
import Time from './ui/Time/Time.vue'

const { showReaction = true } = defineProps<{
  showReaction?: boolean
}>()

const PATH_PLACEHOLDER_REGEX = /:path/g

const { theme, page } = useData()
const { t } = useI18n({ useScope: 'global' })

const editLink = computed(() => !import.meta.env.DEV
  ? 'https://github.com/kongying-tavern/docs/edit/main/src/:path'.replace(
      PATH_PLACEHOLDER_REGEX,
      page.value.filePath,
    )
  : `${window.location.origin}/__open-in-editor?file=${encodeURIComponent(`./src/${page.value.filePath}`)}`,
)

const items = computed(() => {
  return [
    {
      label: import.meta.env.DEV ? t('forum.labels.openInEditor') : t('asideLinks.editLink'),
      icon: 'i-lucide:square-pen',
      href: editLink.value,
    },
    {
      label: t('asideLinks.translateThisPage'),
      icon: 'i-lucide:languages',
      href: '/translations',
    },
  ]
})
</script>

<template>
  <div
    class="font-[var(--vp-font-family-subtitle)] pt-5 border-color-[var(--vp-c-divider)] border-none space-y-6 hidden !mt-5 lg:block"
  >
    <div class="space-y-3">
      <div
        class="text-xs text-color-[var(--vp-c-text-2)] mb-12 flex shrink-0 flex-col gap-1 transition-10"
      >
        <p v-if="page?.lastUpdated">
          {{ theme.lastUpdated?.text }}
          <Time :datetime="page.lastUpdated" relative />
        </p>

        <VPLink
          v-for="item in items"
          :key="item.label"
          class="vp-link underline-offset-2 flex gap-1.5 transition-200 items-center [&:not(:first-child)]:pt-1 hover:underline"
          :href="item.href"
          rel="noopener noreferrer"
          target="_blank"
          :no-icon="true"
        >
          <span class="flex-shrink-0 h-4 w-4" :class="item.icon" />
          <span>
            {{ item.label }}
          </span>
        </VPLink>
      </div>
      <DocReaction v-if="showReaction" class="content-enter content-enter-right" variant="card" />
    </div>
  </div>
</template>
