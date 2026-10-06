<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumLabelStore } from '~/forum/composables/state/useForumLabelStore'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { parseForumSearchQuery } from '~/forum/services/forumSearchQuery'
import { getTopicTagLabelGetter } from '~/forum/services/getTopicTagLabelGetter'
import { getTopicTagMap } from '~/forum/services/getTopicTagMap'
import ForumTagList from '../ui/ForumTagList.vue'

const { message } = useLocalized()
const { list } = useForumRoute()
const copy = computed(() => message.value.forum.aside.tagFilter)

const labelStore = useForumLabelStore()

// 静态 i18n 标签打底，合并仓库实时 CATA- 标签（管理页增删后即时生效）；
// 映射按当前语言即时重建，切换语言后列表与显示名同步刷新
const labels = computed(() => {
  const staticLabels = getTopicTagLabelGetter().toLabels([
    ...getTopicTagMap(message).keys(),
  ])
  const dynamicLabels = labelStore.categoryLabels.value.map(label => label.name)
  return [...new Set([...staticLabels, ...dynamicLabels])].filter((label): label is string => typeof label === 'string')
})
const active = computed(() => parseForumSearchQuery(list.value?.q ?? '').tags)

onMounted(() => {
  void labelStore.loadLabels()
})
</script>

<template>
  <section class="aside-tag-filter mb-4" aria-labelledby="aside-tag-filter-title">
    <div class="lh-14 font-[var(--vp-font-family-subtitle)] mb-4 vp-border-divider h-14">
      <h2 id="aside-tag-filter-title" class="aside-tag-filter-title color-[var(--vp-c-text-1)]">
        {{ copy.title }}
      </h2>
    </div>

    <ForumTagList :data="labels" :active="active" />
  </section>
</template>

<style scoped>
/* 卡片内小节的标题跟同卡片的其它小节一致，需比 .forum-context-aside :deep(h2) 更具体 */
.aside-tag-filter .aside-tag-filter-title {
  font-size: calc(16px * var(--site-ui-scale));
  line-height: inherit;
}
</style>
