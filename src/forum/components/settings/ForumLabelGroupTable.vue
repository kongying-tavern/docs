<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import type { ForumLabelGroup, ForumLabelRow } from '~/forum/services/forumLabelTaxonomy'
import { computed, ref } from 'vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useLocalized } from '@/hooks/useLocalized'
import { getFallbackLabelDisplay } from '~/forum/services/forumLabelTaxonomy'
import { getTopicStatusFromLabel } from '~/forum/services/forumTopicStatus'
import { getTopicTagLabelGetter } from '~/forum/services/getTopicTagLabelGetter'
import { getTopicTagMap } from '~/forum/services/getTopicTagMap'
import { getTopicTypeLabelGetter } from '~/forum/services/getTopicTypeLabelGetter'
import ForumTopicStatusBadge from '../ui/ForumTopicStatusBadge.vue'
import ForumTopicTypeBadge from '../ui/ForumTopicTypeBadge.vue'

defineProps<{
  groups: { group: ForumLabelGroup, rows: ForumLabelRow[] }[]
}>()
defineSlots<{
  'header': () => unknown
  'row-actions': (props: { row: ForumLabelRow }) => unknown
}>()

const { message } = useLocalized()

/** 分组折叠状态：默认全部展开，记录被手动收起的组；两张表分组不重叠，各自持有 */
const collapsedGroups = ref<Partial<Record<ForumLabelGroup, boolean>>>({})

const typeLabelGetter = getTopicTypeLabelGetter()
// 响应式：语言切换后按新 locale 重建，表格里的标签显示名随即更新
const topicTagMap = computed(() => getTopicTagMap(message))
const topicTagLabelGetter = getTopicTagLabelGetter()

function groupLabel(group: ForumLabelGroup): string {
  return message.value.forum.labelAdmin.groups[group]
}

/** 标签在站点 UI 中的翻译名：状态/反馈标签取对应词条，无词条返回空 */
function getUiLabelName(row: ForumLabelRow): string {
  if (row.group === 'status') {
    const status = getTopicStatusFromLabel(row.label.name)
    return status ? message.value.forum.topic.status[status] : ''
  }
  if (row.group === 'category') {
    return topicTagMap.value.get(row.label.name)
      ?? topicTagMap.value.get(topicTagLabelGetter.getTag(row.label.name) ?? '')
      ?? ''
  }
  return ''
}

function isGroupCollapsed(group: ForumLabelGroup): boolean {
  return collapsedGroups.value[group] === true
}

function toggleGroup(group: ForumLabelGroup): void {
  collapsedGroups.value = {
    ...collapsedGroups.value,
    [group]: !isGroupCollapsed(group),
  }
}

/** 预览与列表页真实渲染对齐：类型/状态标签取其语义色块，其余取 Gitee 标签色 */
function previewType(row: ForumLabelRow): ForumAPI.TopicKind | null {
  const type = typeLabelGetter.getType(row.label.name)
  return type ? type.toLocaleUpperCase() as ForumAPI.TopicKind : null
}

function previewStatus(row: ForumLabelRow): ForumAPI.TopicStatus | undefined {
  return getTopicStatusFromLabel(row.label.name)
}
</script>

<template>
  <section class="label-table rounded-xl overflow-hidden">
    <Table class="table-fixed">
      <colgroup>
        <col class="w-36">
        <col>
        <col class="w-24">
      </colgroup>
      <TableHeader>
        <TableRow>
          <TableHead colspan="3" class="pl-4 pr-3 h-12">
            <slot name="header" />
          </TableHead>
        </TableRow>
        <TableRow>
          <TableHead class="pl-4 w-36">
            {{ message.forum.labelAdmin.columnPreview }}
          </TableHead>
          <TableHead class="px-0">
            {{ message.forum.labelAdmin.columnName }}
          </TableHead>
          <TableHead class="pr-4 text-right w-24">
            {{ message.forum.labelAdmin.columnActions }}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-for="entry in groups" :key="entry.group">
          <TableRow
            class="label-group-row cursor-pointer select-none"
            :aria-expanded="!isGroupCollapsed(entry.group)"
            @click="toggleGroup(entry.group)"
          >
            <TableCell
              colspan="3"
              class="text-[var(--vp-c-text-1)] font-semibold px-4 py-2.5 text-ui-13"
            >
              <span class="flex gap-2 items-center">
                <span
                  class="i-lucide-chevron-right size-4 transition-transform"
                  :class="{ 'rotate-90': !isGroupCollapsed(entry.group) }"
                  aria-hidden="true"
                />
                {{ groupLabel(entry.group) }}
                <span class="text-xs text-[var(--vp-c-text-3)] font-normal ml-0.5 tabular-nums">
                  {{ entry.rows.length }}
                </span>
              </span>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colspan="3" class="p-0">
              <!-- 收起时以左右留白的分隔线收尾，展开时渲染内容块 -->
              <div v-if="isGroupCollapsed(entry.group)" class="label-group-collapsed-line" />
              <div v-else class="label-group-body">
                <div
                  v-for="row in entry.rows"
                  :key="row.label.id"
                  :data-feedback-label="row.label.name"
                  class="label-group-item"
                >
                  <span class="pl-2 flex gap-2 min-w-0 items-center">
                    <template v-if="previewType(row)">
                      <!-- 类型直接复用正式徽章组件（色块 + 类型翻译名） -->
                      <ForumTopicTypeBadge :type="previewType(row)" />
                    </template>
                    <template v-else-if="previewStatus(row)">
                      <ForumTopicStatusBadge :status="previewStatus(row)" />
                      <span class="text-xs text-[var(--vp-c-text-3)] truncate">
                        {{ getUiLabelName(row) }}
                      </span>
                    </template>
                    <template v-else-if="row.group === 'category'">
                      <!-- 反馈标签用正式 pill 渲染（#翻译名），不渲染色块 -->
                      <span
                        class="font-size-3 color-[var(--vp-c-text-2)] font-[var(--vp-font-family-subtitle)] px-2.5 py-0.5 rounded-full bg-[var(--vp-c-gray-soft)] inline-flex truncate items-center"
                      >
                        #{{ getUiLabelName(row) || getFallbackLabelDisplay(row.label.name) }}
                      </span>
                    </template>
                    <template v-else>
                      <!-- 无语义预览的标签：图标 + 说明，不用颜色占位 -->
                      <span
                        class="i-lucide-eye-off text-[var(--vp-c-text-3)] shrink-0 size-4"
                        aria-hidden="true"
                      />
                      <span class="text-xs text-[var(--vp-c-text-3)] truncate">
                        {{ message.forum.labelAdmin.noPreview }}
                      </span>
                    </template>
                  </span>
                  <span class="text-xs text-[var(--vp-c-text-1)] font-mono px-0 truncate">
                    {{ row.label.name }}
                  </span>
                  <slot name="row-actions" :row="row" />
                </div>
              </div>
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </section>
</template>

<style scoped>
/* 表格外框：包围边框 + 圆角，颜色直接吃 VitePress 分隔变量 */
.label-table {
  border: 1px solid var(--vp-c-divider);
}

/* 表身统一行边框色：不依赖 UnoCSS 简写 */
.label-table :deep(.table-row) {
  border-color: var(--vp-c-divider);
}

/* 除 header 操作行外的行不出现背景颜色变化（压掉组件的 hover 底色） */
.label-table :deep(.table-row:hover) {
  background: transparent;
}

/* header：只给第一行（标题 + 操作按钮）浅底，列头行只需下边框 */
.label-table :deep(.table-header) tr:first-child {
  background: var(--vp-c-default-soft);
}

.label-table :deep(.table-header) tr:last-child {
  border-bottom: 1px solid var(--vp-c-divider);
}

/* 分组标题行：整行可点，行高对齐由单元格 padding 控制，不加背景与下边框 */
.label-table :deep(.label-group-row) {
  cursor: pointer;
}

.label-table :deep(.label-group-row > td) {
  border-bottom: 0;
}

/* 组内容块：整体外边框 + 圆角，左右留白不贴表格边缘，行间以细线分隔 */
.label-table :deep(.label-group-body) {
  margin: 0 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

/* 折叠收起的组：以左右留白的分隔线收尾 */
.label-table :deep(.label-group-collapsed-line) {
  margin: 0 8px;
  border-bottom: 1px solid var(--vp-c-divider);
}

/* 最后一个分组（展开块或折叠线）与表格底边也留出边距 */
.label-table :deep(.table-row):last-child .label-group-body,
.label-table :deep(.table-row):last-child .label-group-collapsed-line {
  margin-bottom: 8px;
}

/* 组内行：三列网格与表头列宽严格对齐（144 / 自适应 / 96），行高 40px */
.label-table :deep(.label-group-item) {
  display: grid;
  grid-template-columns: 144px minmax(0, 1fr) 96px;
  align-items: center;
  min-height: 40px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.label-table :deep(.label-group-item:last-child) {
  border-bottom: 0;
}
</style>
