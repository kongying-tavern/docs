import type { Ref } from 'vue'
import type { EnhancedBlogPost } from '~/components/blog/composables/useBlogData'
import { withBase } from 'vitepress'
import { ref, unref } from 'vue'
import { toast } from 'vue-sonner'
import { blog } from '@/apis/forum/gitee'
import { getLangPath } from '@/utils'
import { useBlogOperations } from '~/components/blog/composables/useBlogOperations'
import { blogDraftDB } from '~/services/blogDraftDB'
import { forumEvents } from '~/services/events/SimpleEventManager'
import { copyToClipboard } from '../../utils/dom-utils'

// 常量定义
const CONSTANTS = {
  BLOG_IMPORT_KEY: 'blog-import-content',
  COPY_TITLE_SUFFIX: ' - 副本',
  FILE_EXTENSIONS: '.md,.txt',
  FILE_TYPE: 'text/markdown',
} as const

// VitePress上下文类型
interface VitePressContext {
  localeIndex: Ref<string> | string
  go: (url: string) => Promise<void>
}

/**
 * 博客URL管理器
 */
class BlogUrlManager {
  constructor(
    private blogPost: EnhancedBlogPost,
    private context: VitePressContext,
  ) {}

  private get basePath(): string {
    return `${getLangPath(unref(this.context.localeIndex))}blog/`
  }

  generateBlogUrl(): string {
    const { source, path, draftData } = this.blogPost

    switch (source) {
      case 'static':
      case 'api':
        return withBase(`${this.basePath}${path}`)
      case 'draft':
        return withBase(`${this.basePath}editor?draft=${draftData?.id}`)
      default:
        return withBase(this.basePath)
    }
  }

  generateEditorUrl(params: Record<string, string> = {}): string {
    const query = new URLSearchParams(params).toString()
    const path = `${this.basePath}editor${query ? `?${query}` : ''}`
    return withBase(path)
  }
}

/**
 * 文件操作管理器
 */
class FileOperationManager {
  downloadFile(content: string, filename: string, type: string = CONSTANTS.FILE_TYPE): void {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    Object.assign(link, { href: url, download: filename })

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  selectFile(accept: string = CONSTANTS.FILE_EXTENSIONS): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      Object.assign(input, { type: 'file', accept })

      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0] || null
        resolve(file)
      }

      input.click()
    })
  }
}

/**
 * 博客操作管理器
 */
class BlogActionManager {
  private urlManager: BlogUrlManager
  private fileManager: FileOperationManager
  private operations: ReturnType<typeof useBlogOperations>

  constructor(
    private blogPost: EnhancedBlogPost,
    private context: VitePressContext,
  ) {
    this.urlManager = new BlogUrlManager(blogPost, context)
    this.fileManager = new FileOperationManager()
    this.operations = useBlogOperations()
  }

  get blogType() {
    return {
      isDraft: this.blogPost.source === 'draft',
      isApi: this.blogPost.source === 'api',
      isStatic: this.blogPost.source === 'static',
    }
  }

  async copyBlogLink(): Promise<void> {
    const url = `${window.location.origin}${this.urlManager.generateBlogUrl()}`
    const success = await copyToClipboard(url)

    toast[success ? 'success' : 'error'](
      success ? '链接已复制到剪贴板' : '复制链接失败',
      { description: success ? url : '请检查浏览器权限后重试' },
    )
  }

  openInGitee(): void {
    blog.openInGitee(this.blogPost.id)
  }

  async editInEditor(): Promise<void> {
    const { isDraft, isApi } = this.blogType
    let targetPath: string

    if (isDraft) {
      targetPath = this.urlManager.generateEditorUrl({
        draft: this.blogPost.draftData?.id || '',
      })
    }
    else if (isApi) {
      targetPath = this.urlManager.generateEditorUrl({
        edit: String(this.blogPost.id),
      })
    }
    else {
      targetPath = this.urlManager.generateBlogUrl()
    }

    await this.context.go(targetPath)
  }

  exportBlog(): void {
    const content = this.blogPost.contentRaw || ''
    const filename = `${this.blogPost.title || 'blog'}.md`
    this.fileManager.downloadFile(content, filename)
  }

  async importBlog(): Promise<void> {
    const file = await this.fileManager.selectFile()
    if (!file)
      return

    const content = await file.text()
    const params = this.buildImportParams()

    sessionStorage.setItem(CONSTANTS.BLOG_IMPORT_KEY, content)
    const editorPath = this.urlManager.generateEditorUrl(params)
    await this.context.go(editorPath)
  }

  private buildImportParams(): Record<string, string> {
    const { isDraft, isApi } = this.blogType
    const params: Record<string, string> = { import: 'true' }

    if (isDraft) {
      params.draft = this.blogPost.draftData?.id || ''
    }
    else if (isApi) {
      params.edit = String(this.blogPost.id)
    }

    return params
  }

  async duplicateBlog(): Promise<void> {
    await this.executeWithToast(
      () => this.createDuplicateDraft(),
      '创建副本',
      '副本已创建',
    )
  }

  private async createDuplicateDraft(): Promise<string> {
    const newDraft = this.buildDuplicateData()
    const draftId = await blogDraftDB.drafts.add(newDraft)

    if (draftId) {
      this.emitDraftCreatedEvent(draftId, newDraft)
    }

    const editorPath = this.urlManager.generateEditorUrl({ draft: String(draftId) })
    await this.context.go(editorPath)

    return `《${this.blogPost.title}${CONSTANTS.COPY_TITLE_SUFFIX}》`
  }

  private buildDuplicateData() {
    const now = new Date()
    return {
      title: `${this.blogPost.title}${CONSTANTS.COPY_TITLE_SUFFIX}`,
      content: this.blogPost.contentRaw || '',
      contentJson: this.blogPost.draftData?.contentJson || '',
      tags: this.blogPost.tags || [],
      createdAt: now,
      updatedAt: now,
      autoSaveAt: now,
    }
  }

  private emitDraftCreatedEvent(draftId: string | number, newDraft: any): void {
    forumEvents.blogDraftCreated({
      ...this.blogPost,
      id: String(draftId),
      source: 'draft',
      draftData: { ...newDraft, id: String(draftId) },
    })
  }

  async publishBlog(): Promise<void> {
    const { isDraft, isApi } = this.blogType

    if (isDraft) {
      await this.handleDraftPublish()
    }
    else if (isApi) {
      await this.handleApiPublish()
    }
  }

  private async handleDraftPublish(): Promise<void> {
    const editorPath = this.urlManager.generateEditorUrl({
      draft: this.blogPost.draftData?.id || '',
      publish: 'true',
    })
    await this.context.go(editorPath)
  }

  private async handleApiPublish(): Promise<void> {
    await this.executeWithToast(
      async () => {
        const success = await this.operations.publishDraft(this.blogPost.id, this.blogPost.tags || [])
        if (!success) {
          throw new Error('请检查网络连接后重试')
        }

        forumEvents.blogPublished(this.blogPost.id, true)
        return `《${this.blogPost.title}》(ID: ${this.blogPost.id})`
      },
      '发布',
      '博客已发布',
    )
  }

  async confirmDelete(): Promise<void> {
    await this.executeWithToast(
      () => this.performDelete(),
      '删除',
      '博客已删除',
    )
  }

  private async performDelete(): Promise<string> {
    const { isDraft, isApi } = this.blogType

    if (isDraft) {
      return this.deleteDraft()
    }
    else if (isApi) {
      return this.deleteApiPost()
    }
    else {
      throw new Error('不支持的博客类型')
    }
  }

  private async deleteDraft(): Promise<string> {
    const draftId = this.blogPost.draftData?.id || ''
    await blogDraftDB.drafts.delete(draftId)
    forumEvents.blogDraftDeleted(draftId)
    return `《${this.blogPost.title}》`
  }

  private async deleteApiPost(): Promise<string> {
    const success = await this.operations.deletePost(this.blogPost.id)
    if (!success) {
      throw new Error('请检查网络连接后重试')
    }

    forumEvents.blogDeleted(this.blogPost.id, 'api')
    const idPart = this.blogPost.id ? ` (ID: ${this.blogPost.id})` : ''
    return `《${this.blogPost.title}》${idPart}`
  }

  private async executeWithToast(
    operation: () => Promise<string>,
    actionName: string,
    successMessage: string,
  ): Promise<void> {
    try {
      const result = await operation()
      toast.success(successMessage, { description: result })
    }
    catch (error) {
      console.error(`${actionName}失败:`, error)
      toast.error(`${actionName}失败`, {
        description: `《${this.blogPost.title}》- ${error instanceof Error ? error.message : '未知错误，请重试'}`,
      })
    }
  }
}

/**
 * 博客菜单操作 Composable
 * 提供博客相关的各种操作功能
 */
export function useBlogMenuActions(
  blogPost: EnhancedBlogPost,
  vitePressContext: VitePressContext,
) {
  const actionManager = new BlogActionManager(blogPost, vitePressContext)
  const showDeleteDialog = ref(false)

  const actions = {
    copyBlogLink: () => actionManager.copyBlogLink(),
    openInGitee: () => actionManager.openInGitee(),
    editInEditor: () => actionManager.editInEditor(),
    exportBlog: () => actionManager.exportBlog(),
    importBlog: () => actionManager.importBlog(),
    duplicateBlog: () => actionManager.duplicateBlog(),
    publishBlog: () => actionManager.publishBlog(),
    deleteBlog: () => { showDeleteDialog.value = true },
    confirmDelete: async () => {
      showDeleteDialog.value = false
      await actionManager.confirmDelete()
    },
    cancelDelete: () => { showDeleteDialog.value = false },
  }

  return {
    ...actions,
    showDeleteDialog,
  }
}
