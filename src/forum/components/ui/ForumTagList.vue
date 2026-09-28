<script setup lang="ts">
import { computed } from 'vue'

import { useForumRoute } from '~/forum/composables/useForumRoute'
import { useTopicTagDisplay } from '~/forum/composables/useTopicTagDisplay'
import { CATEGORY_LABEL_PREFIX } from '~/forum/services/label'

const props = defineProps<{
  data: string[]
  /** 已经在用的标签（label）：高亮展示，点击即在该标签与「不筛」之间切换 */
  active?: string[]
}>()

const { getTagDisplay } = useTopicTagDisplay()
const { addSearchFacet, toggleSearchFacet } = useForumRoute()

// 反馈标签按前缀识别，不依赖静态映射表，动态新增的 CATA- 标签同样可展示
const tags = computed(() =>
  props.data.filter(label => label.startsWith(CATEGORY_LABEL_PREFIX)),
)

const activeTags = computed(() => props.active ?? [])
const isActive = (label: string) => activeTags.value.includes(label)

// 传了 active 说明这里是筛选器，点击按当前搜索串切换；否则（话题正文里的标签）只做追加。
// 切换与否不看渲染出来的高亮，避免渲染还没跟上时把「取消」点成一次无效的追加。
const isFilter = computed(() => props.active !== undefined)

function selectTag(label: string) {
  return isFilter.value ? toggleSearchFacet('tags', label) : addSearchFacet('tags', label)
}
</script>

<template>
  <div v-if="tags.length > 0">
    <button
      v-for="label in tags"
      :key="label"
      type="button"
      class="forum-tag-filter font-size-3 color-[--vp-c-text-2] font-[var(--vp-font-family-subtitle)] mr-2 mt-2 px-2.5 rounded-full bg-[--vp-c-gray-soft] inline-flex pointer-events-auto"
      :class="{ 'forum-tag-filter-active': isActive(label) }"
      :aria-pressed="isActive(label)"
      @pointerdown.stop
      @click.stop="selectTag(label)"
    >
      #{{ getTagDisplay(label) }}
    </button>
  </div>
</template>

<style scoped>
.forum-tag-filter {
  border: 0;
  line-height: 1.75;
  cursor: pointer;
  transition:
    color 120ms ease,
    background-color 120ms ease;
}

.forum-tag-filter:hover,
.forum-tag-filter:focus-visible {
  color: var(--vp-c-text-1);
  background: var(--vp-c-default-3);
}

/* 命中中的标签：品牌色标出来，再点一次取消该标签的筛选 */
.forum-tag-filter-active,
.forum-tag-filter-active:hover,
.forum-tag-filter-active:focus-visible {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
</style>
