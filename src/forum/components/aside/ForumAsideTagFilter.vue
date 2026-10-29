<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { useForumTagFilterOptions } from '~/forum/composables/view/useForumTagFilterOptions'
import { parseForumSearchQuery } from '~/forum/services/forumSearchQuery'
import ForumTagList from '../ui/ForumTagList.vue'

const { t } = useI18n({ useScope: 'global' })
const { list } = useForumRoute()

const { options } = useForumTagFilterOptions()
const labels = computed(() => options.value.map(option => option.id))
const active = computed(() => parseForumSearchQuery(list.value?.q ?? '').tags)
</script>

<template>
  <section class="aside-tag-filter mb-4" aria-labelledby="aside-tag-filter-title">
    <div class="lh-14 font-[var(--vp-font-family-subtitle)] mb-4 vp-border-divider h-14">
      <h2 id="aside-tag-filter-title" class="aside-tag-filter-title color-[var(--vp-c-text-1)]">
        {{ t('forum.aside.tagFilter.title') }}
      </h2>
    </div>

    <ForumTagList :data="labels" :active="active" />
  </section>
</template>

<style scoped>
/* 卡片内小节的标题跟同卡片的其它小节一致，需比 .forum-context-aside :deep(h2) 更具体 */
.aside-tag-filter .aside-tag-filter-title {
  @apply text-ui-16;
  line-height: inherit;
}
</style>
