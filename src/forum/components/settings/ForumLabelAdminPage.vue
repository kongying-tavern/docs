<script setup lang="ts">
import type { ForumLabelGroup, ForumLabelRow } from '~/forum/services/forumLabelTaxonomy'
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
import { useLocalized } from '@/hooks/useLocalized'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useForumLabelStore } from '~/forum/composables/state/useForumLabelStore'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { toast } from '~/services/telemetry/toast'
import ForumLabelFormDialog from './ForumLabelFormDialog.vue'
import ForumLabelGroupTable from './ForumLabelGroupTable.vue'

const { embedded = false } = defineProps<{
  embedded?: boolean
}>()

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
    <div class="label-admin-page" :class="{ embedded }">
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
          <p v-if="!isLoading && !loadError" class="text-xs text-[var(--vp-c-text-3)] tabular-nums">
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
          <ForumLabelGroupTable :groups="manageableGroups">
            <template #header>
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
            </template>
            <template #row-actions="{ row }">
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
            </template>
          </ForumLabelGroupTable>

          <!-- 系统保留：只读，内部按类型/状态/功能标签分块可折叠 -->
          <ForumLabelGroupTable :groups="reservedGroups">
            <template #header>
              <div class="flex flex-wrap gap-x-2 gap-y-0.5 items-baseline">
                <span class="text-sm text-[var(--vp-c-text-2)] font-semibold">
                  {{ message.forum.labelAdmin.reservedSection }}
                </span>
                <span class="text-xs text-[var(--vp-c-text-3)]">
                  {{ message.forum.labelAdmin.reservedHint }}
                </span>
              </div>
            </template>
            <template #row-actions>
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
            </template>
          </ForumLabelGroupTable>

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

.label-admin-page.embedded {
  width: 100%;
  padding: 0;
}
</style>
