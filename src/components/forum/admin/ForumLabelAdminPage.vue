<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { ForumLabelGroup, ForumLabelRow } from '~/services/forum/forumLabelTaxonomy'
import { useRouter } from 'vitepress'
import { computed, onMounted, ref, watch } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useLocalized } from '@/hooks/useLocalized'
import { getTopicTagLabelGetter } from '~/composables/getTopicTagLabelGetter'
import { getTopicTagMap } from '~/composables/getTopicTagMap'
import { getTopicTypeLabelGetter } from '~/composables/getTopicTypeLabelGetter'
import { useForumLabelStore } from '~/composables/useForumLabelStore'
import { useForumRoute } from '~/composables/useForumRoute'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { getFallbackLabelDisplay } from '~/services/forum/forumLabelTaxonomy'
import { getTopicStatusFromLabel } from '~/services/forum/forumTopicStatus'
import { toast } from '~/services/telemetry/toast'
import ForumTopicStatusBadge from '../ui/ForumTopicStatusBadge.vue'
import ForumTopicTypeBadge from '../ui/ForumTopicTypeBadge.vue'
import ForumLabelFormDialog from './ForumLabelFormDialog.vue'

const { message } = useLocalized()
const router = useRouter()
const { homeHref } = useForumRoute()
const labelStore = useForumLabelStore()
const { hasAnyPermissions } = useRuleChecks()
const canManage = hasAnyPermissions('manage_feedback')

const MANAGEABLE_GROUPS: readonly ForumLabelGroup[] = ['category', 'status', 'locale', 'other']
const RESERVED_GROUPS: readonly ForumLabelGroup[] = ['type', 'special']

const manageableGroups = computed(() =>
  labelStore.groupedRows.value.filter(entry => MANAGEABLE_GROUPS.includes(entry.group)),
)

const reservedGroups = computed(() =>
  labelStore.groupedRows.value.filter(entry => RESERVED_GROUPS.includes(entry.group)),
)

const totalCount = computed(() => labelStore.labels.value.length)
const isLoading = computed(() => labelStore.isLoading.value)
const loadError = computed(() => labelStore.error.value)
const hasLoaded = computed(() => totalCount.value > 0 || Boolean(loadError.value))

const createOpen = ref(false)
const editingRow = ref<ForumLabelRow | null>(null)
const deleteTarget = ref<ForumLabelRow | null>(null)
const deleting = ref(false)

/** 分组折叠状态：默认全部展开，记录被手动收起的组 */
const collapsedGroups = ref<Partial<Record<ForumLabelGroup, boolean>>>({})

const typeLabelGetter = getTopicTypeLabelGetter()
const topicTagMap = getTopicTagMap()
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
    return topicTagMap.get(row.label.name)
      ?? topicTagMap.get(topicTagLabelGetter.getTag(row.label.name) ?? '')
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

function openCreate(): void {
  editingRow.value = null
  createOpen.value = true
}

function openEdit(row: ForumLabelRow): void {
  editingRow.value = row
  createOpen.value = true
}

function refresh(): void {
  void labelStore.loadLabels(true).then(() => {
    if (!labelStore.error.value) {
      toast.success(
        message.value.forum.labelAdmin.refreshSuccess.replace(
          '{count}',
          String(labelStore.labels.value.length),
        ),
      )
    }
  })
}

function backToList(): void {
  void router.go(homeHref())
}

async function handleDelete(): Promise<void> {
  const target = deleteTarget.value
  if (!target)
    return

  deleting.value = true
  try {
    const deleted = await labelStore.deleteForumLabel(target.label.name)
    if (deleted) {
      toast.success(
        message.value.forum.labelAdmin.deleteSuccess.replace('{name}', target.label.name),
      )
    }
    deleteTarget.value = null
  }
  catch (error) {
    toast.error(
      message.value.forum.labelAdmin.operateFailed.replace(
        '{message}',
        error instanceof Error ? error.message : message.value.forum.errors.unknownError,
      ),
      { error, scene: 'op' },
    )
  }
  finally {
    deleting.value = false
  }
}

// 成员列表异步加载，权限就绪后再拉取；未登录/无权限不发请求
watch(canManage, (allowed) => {
  if (allowed && !hasLoaded.value)
    void labelStore.loadLabels()
}, { immediate: true })

onMounted(() => {
  if (canManage.value && !hasLoaded.value)
    void labelStore.loadLabels()
})
</script>

<template>
  <ClientOnly>
    <div class="label-admin-page">
      <!-- 权限门禁：入口虽不可见，直连 URL 也要挡住（真正的安全由 Gitee API 权限兜底） -->
      <Alert v-if="!canManage" variant="destructive" class="mx-auto my-8 max-w-xl">
        <span class="i-lucide-shield-alert" aria-hidden="true" />
        <AlertTitle>{{ message.forum.labelAdmin.accessDenied }}</AlertTitle>
        <AlertDescription>{{ message.forum.labelAdmin.accessDeniedDescription }}</AlertDescription>
      </Alert>
      <Button
        v-if="!canManage"
        type="button"
        variant="outline"
        size="sm"
        class="mx-auto my-2 max-w-xl block"
        @click="backToList"
      >
        <span class="i-lucide-arrow-left size-4" aria-hidden="true" />
        {{ message.forum.labelAdmin.backToList }}
      </Button>

      <div v-else class="flex flex-col gap-6">
        <div class="flex flex-col gap-1 min-w-0">
          <h1 class="text-xl text-[var(--vp-c-text-1)] font-semibold">
            {{ message.forum.labelAdmin.title }}
          </h1>
          <p class="text-sm text-[var(--vp-c-text-2)]">
            {{ message.forum.labelAdmin.description }}
          </p>
          <p v-if="!isLoading && !loadError" class="text-xs text-[var(--vp-c-text-3)]">
            {{ message.forum.labelAdmin.count.replace('{count}', String(totalCount)) }}
          </p>
        </div>

        <div v-if="isLoading && !hasLoaded" class="flex flex-col gap-3" aria-busy="true">
          <Skeleton class="h-8 w-40" />
          <Skeleton v-for="index in 4" :key="index" class="h-12 w-full" />
        </div>

        <div v-else-if="loadError" class="py-10 flex flex-col gap-3 items-center" role="alert">
          <span class="i-lucide-circle-alert text-[var(--vp-c-text-3)] size-8" aria-hidden="true" />
          <p class="text-sm text-[var(--vp-c-text-2)]">
            {{ message.forum.labelAdmin.loadFailed }}
          </p>
          <Button type="button" variant="outline" size="sm" @click="refresh">
            {{ message.forum.labelAdmin.retry }}
          </Button>
        </div>

        <template v-else>
          <!-- 可管理标签：内部按组分块可折叠，操作按钮收进表头右侧 -->
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
                    <div class="flex gap-2 items-center">
                      <span class="text-sm text-[var(--vp-c-text-1)] font-semibold">
                        {{ message.forum.labelAdmin.manageableSection }}
                      </span>
                      <span class="ml-auto flex gap-2 items-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          :disabled="isLoading"
                          :aria-label="message.forum.labelAdmin.refresh"
                          @click="refresh"
                        >
                          <span
                            class="i-lucide-refresh-cw size-4"
                            :class="{ 'animate-spin': isLoading }"
                            aria-hidden="true"
                          />
                          {{ message.forum.labelAdmin.refresh }}
                        </Button>
                        <Button type="button" size="sm" @click="openCreate">
                          <span class="i-lucide-plus size-4" aria-hidden="true" />
                          {{ message.forum.labelAdmin.create }}
                        </Button>
                      </span>
                    </div>
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
                <template v-for="entry in manageableGroups" :key="entry.group">
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
                        <span class="text-xs text-[var(--vp-c-text-3)] font-normal ml-0.5">
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
                          <span class="pr-2 flex gap-1 w-full items-center justify-end">
                            <a
                              class="text-[var(--vp-c-text-2)] rounded-md inline-flex shrink-0 size-6 transition-colors items-center justify-center hover:text-accent-foreground hover:bg-accent dark:hover:bg-accent/50"
                              :href="row.label.url"
                              target="_blank"
                              rel="noopener"
                              :aria-label="message.forum.topic.menu.giteeLink"
                              :title="message.forum.topic.menu.giteeLink"
                            >
                              <span class="i-lucide-external-link size-3.5" aria-hidden="true" />
                            </a>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              class="text-[var(--vp-c-text-2)]"
                              :aria-label="message.forum.labelAdmin.edit"
                              :title="message.forum.labelAdmin.edit"
                              @click="openEdit(row)"
                            >
                              <span class="i-lucide-pencil size-3.5" aria-hidden="true" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              class="text-[var(--vp-c-text-2)] hover:text-destructive"
                              :aria-label="message.forum.labelAdmin.delete"
                              :title="message.forum.labelAdmin.delete"
                              @click="deleteTarget = row"
                            >
                              <span class="i-lucide-trash-2 size-3.5" aria-hidden="true" />
                            </Button>
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </template>
              </TableBody>
            </Table>
          </section>

          <!-- 系统保留：只读，内部按类型/状态/功能标签分块可折叠 -->
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
                    <div class="flex flex-wrap gap-x-2 gap-y-0.5 items-baseline">
                      <span class="text-sm text-[var(--vp-c-text-2)] font-semibold">
                        {{ message.forum.labelAdmin.reservedSection }}
                      </span>
                      <span class="text-xs text-[var(--vp-c-text-3)]">
                        {{ message.forum.labelAdmin.reservedHint }}
                      </span>
                    </div>
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
                <template v-for="entry in reservedGroups" :key="entry.group">
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
                        <span class="text-xs text-[var(--vp-c-text-3)] font-normal ml-0.5">
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
                          <span
                            class="pr-2 flex w-full items-center justify-end"
                            :aria-label="message.forum.labelAdmin.reservedHint"
                            :title="message.forum.labelAdmin.reservedHint"
                          >
                            <span
                              class="i-lucide-lock text-[var(--vp-c-text-3)] size-3.5"
                              aria-hidden="true"
                            />
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </template>
              </TableBody>
            </Table>
          </section>

          <p v-if="totalCount === 0" class="text-sm text-[var(--vp-c-text-3)] py-8 text-center">
            {{ message.forum.labelAdmin.empty }}
          </p>
        </template>
      </div>

      <ForumLabelFormDialog
        v-model:open="createOpen"
        :label="editingRow?.label ?? null"
        :existing-names="labelStore.allLabelNames.value"
      />

      <AlertDialog
        :open="Boolean(deleteTarget)"
        @update:open="value => !value && (deleteTarget = null)"
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ message.forum.labelAdmin.deleteTitle }}</AlertDialogTitle>
            <AlertDialogDescription>
              {{ message.forum.labelAdmin.deleteDescription.replace('{name}', deleteTarget?.label.name ?? '') }}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel :disabled="deleting">
              {{ message.ui.button.cancel }}
            </AlertDialogCancel>
            <AlertDialogAction
              class="text-white bg-destructive hover:bg-destructive/90"
              :disabled="deleting"
              @click="handleDelete"
            >
              {{ message.forum.labelAdmin.deleteConfirm }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </ClientOnly>
</template>

<style scoped>
/* 内容区与设置页同宽居中，标题区也沿用设置页的分隔手法 */
.label-admin-page {
  width: min(920px, 100%);
  margin-inline: auto;
  padding: 48px 32px 96px;
}

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
