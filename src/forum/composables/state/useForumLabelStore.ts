import { createGlobalState } from '@vueuse/core'
import { computed, ref } from 'vue'
import { labels } from '~/forum/api/gitee'
import { invalidateLabelsCache } from '~/forum/api/gitee/labels'
import {
  classifyForumLabel,
  groupForumLabels,
  toForumLabelRow,
} from '~/forum/services/labelTaxonomy'

/**
 * Feedback 仓库标签的会话级共享状态：一次拉取全站复用（apiCall 自带
 * 会话级 memoize 与请求去重），CRUD 后失效缓存并同步本地列表。
 * 不在初始化时自动请求，由消费方按需调用 loadLabels。
 */
export const useForumLabelStore = createGlobalState(() => {
  const labels_ = ref<GITEE.IssueLabel[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  let inFlight: Promise<void> | null = null

  /**
   * force=true 时绕过会话缓存重新拉取（管理页刷新/写后同步）；并发调用共享同一 Promise。
   * 注意 useMemoize 的 load() 命中缓存会直接返回不执行函数，所以强制刷新必须先把缓存键删掉。
   */
  function loadLabels(force = false): Promise<void> {
    if (inFlight)
      return inFlight

    if (force)
      invalidateLabelsCache()

    isLoading.value = true
    error.value = null
    inFlight = (async () => {
      try {
        labels_.value = await labels.getAllLabels(force)
      }
      catch (cause) {
        error.value = cause instanceof Error ? cause : new Error(String(cause))
      }
      finally {
        isLoading.value = false
        inFlight = null
      }
    })()
    return inFlight
  }

  function upsertLocal(next: GITEE.IssueLabel): void {
    const index = labels_.value.findIndex(label => label.id === next.id)
    if (index >= 0)
      labels_.value.splice(index, 1, next)
    else
      labels_.value.push(next)
  }

  async function createForumLabel(name: string, color: string): Promise<GITEE.IssueLabel> {
    const created = await labels.createLabel(name, color)
    invalidateLabelsCache()
    upsertLocal(created)
    return created
  }

  async function updateForumLabel(
    originalName: string,
    data: { name?: string, color?: string },
  ): Promise<GITEE.IssueLabel> {
    const updated = await labels.updateLabel(originalName, data)
    invalidateLabelsCache()
    // 改名后本地可能存在新旧两条记录，先移除同名旧项再合入
    labels_.value = labels_.value.filter(
      label => label.id !== updated.id && label.name.toLowerCase() !== originalName.toLowerCase(),
    )
    labels_.value.push(updated)
    return updated
  }

  async function deleteForumLabel(name: string): Promise<boolean> {
    const deleted = await labels.deleteLabel(name)
    if (deleted) {
      invalidateLabelsCache()
      labels_.value = labels_.value.filter(
        label => label.name.toLowerCase() !== name.toLowerCase(),
      )
    }
    return deleted
  }

  const allLabelNames = computed(() => labels_.value.map(label => label.name))

  /** 发布表单 / 搜索筛选的候选：全部 CATA- 反馈标签（动态，来自仓库实时列表） */
  const categoryLabels = computed(() =>
    labels_.value.filter(label => classifyForumLabel(label.name) === 'category'),
  )

  /** 管理页分组行模型，含保留标记与色值 */
  const groupedRows = computed(() =>
    groupForumLabels(labels_.value).map(entry => ({
      ...entry,
      rows: entry.labels.map(toForumLabelRow),
    })),
  )

  return {
    labels: labels_,
    isLoading,
    error,
    loadLabels,
    createForumLabel,
    updateForumLabel,
    deleteForumLabel,
    allLabelNames,
    categoryLabels,
    groupedRows,
  }
})
