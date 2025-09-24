import type { FORUM } from '../../types'
import type { EnhancedBlogPost } from '~/components/blog/composables/useBlogData'
import { useData, useRouter } from 'vitepress'
import { computed } from 'vue'
import { useBlogOperations } from '~/components/blog/composables/useBlogOperations'
import { formatWordCount } from '../utils/wordCount'
import { useBlogMenuActions } from './useBlogMenuActions'

export function useBlogDropdownMenu(blogPost: EnhancedBlogPost, options?: { isInEditor?: boolean }) {
  const { canManageBlog, canEditPost } = useBlogOperations()
  const { localeIndex } = useData()
  const { go } = useRouter()
  const isInEditor = options?.isInEditor ?? false

  const {
    copyBlogLink,
    openInGitee,
    editInEditor,
    exportBlog,
    importBlog,
    duplicateBlog,
    publishBlog,
    deleteBlog,
    showDeleteDialog,
    confirmDelete,
    cancelDelete,
  } = useBlogMenuActions(blogPost, {
    localeIndex,
    go,
  })

  const dropdownMenu = computed<FORUM.TopicDropdownMenu[]>(() => {
    if (!canManageBlog.value) {
      return []
    }

    const canEdit = canEditPost(blogPost)
    const isDraft = blogPost.source === 'draft'
    const isApi = blogPost.source === 'api'

    const menuItems: FORUM.TopicDropdownMenu[] = []

    // 基础操作
    addBasicActions(menuItems, { copyBlogLink, openInGitee, isApi })

    // 编辑器特有操作（预览、发布）
    if (blogPost.editorActions) {
      addEditorActions(menuItems, blogPost.editorActions)
    }

    if (canEdit) {
      // 编辑操作
      addEditActions(menuItems, {
        editInEditor,
        exportBlog,
        importBlog,
        duplicateBlog,
        publishBlog,
        deleteBlog,
        isDraft,
        isApi,
        blogPost,
        isInEditor,
      })
    }

    // 底部信息
    addMetaInfo(menuItems, blogPost)

    return menuItems
  })

  return {
    dropdownMenu,
    showDeleteDialog,
    confirmDelete,
    cancelDelete,
  }
}

// 添加编辑器特有操作
function addEditorActions(
  menuItems: FORUM.TopicDropdownMenu[],
  editorActions: NonNullable<EnhancedBlogPost['editorActions']>,
) {

  menuItems.push({
    type: 'separator',
    order: 1.5,
  })

  // 预览
  menuItems.push({
    type: 'item',
    id: 'preview',
    order: 1.6,
    label: '预览',
    icon: 'i-lucide:eye',
    action: editorActions.previewBlog,
  })

  // 发布中状态提示
  if (editorActions.isPublishing.value) {
    menuItems.push({
      type: 'item',
      id: 'publishing-status',
      order: 1.7,
      label: '发布中...',
      icon: 'i-lucide:loader-2',
      disabled: true,
      class: 'animate-spin',
    })
  }
  // 发布（仅在可发布且不在发布中时显示）
  else if (editorActions.canPublish.value) {
    menuItems.push({
      type: 'item',
      id: 'publish-editor',
      order: 1.7,
      label: '发布',
      icon: 'i-lucide:send',
      action: () => {
        // 处理异步发布操作
        editorActions.publishBlog().catch(console.error)
      },
    })
  }
  // 不可发布状态提示
  else {
    menuItems.push({
      type: 'item',
      id: 'publish-disabled',
      order: 1.7,
      label: '发布 (不可用)',
      icon: 'i-lucide:send',
      disabled: true,
      class: 'opacity-50',
    })
  }
}

// 添加基础操作
function addBasicActions(
  menuItems: FORUM.TopicDropdownMenu[],
  actions: { copyBlogLink: () => Promise<void>, openInGitee: () => void, isApi: boolean },
) {
  // 拷贝链接
  menuItems.push({
    type: 'item',
    id: 'copy-link',
    order: 1,
    label: '拷贝链接',
    icon: 'i-lucide:link',
    action: actions.copyBlogLink,
  })

  // 在Gitee打开（仅API博客）
  if (actions.isApi) {
    menuItems.push({
      type: 'item',
      id: 'open-gitee',
      order: 2,
      label: '在Gitee打开',
      icon: 'i-lucide:external-link',
      action: actions.openInGitee,
    })
  }
}

// 添加编辑操作
function addEditActions(
  menuItems: FORUM.TopicDropdownMenu[],
  actions: {
    editInEditor: () => void
    exportBlog: () => void
    importBlog: () => void
    duplicateBlog: () => Promise<void>
    publishBlog: () => Promise<void>
    deleteBlog: () => void
    isDraft: boolean
    isApi: boolean
    blogPost: EnhancedBlogPost
    isInEditor: boolean
  },
) {
  menuItems.push({
    type: 'separator',
    order: 3,
  })

  // 在编辑器打开（仅在非编辑器页面显示）
  if (!actions.isInEditor) {
    menuItems.push({
      type: 'item',
      id: 'edit-in-editor',
      order: 4,
      label: '在编辑器打开',
      icon: 'i-lucide:edit',
      action: actions.editInEditor,
    })
  }

  // 导出
  menuItems.push({
    type: 'item',
    id: 'export',
    order: 5,
    label: '导出',
    icon: 'i-lucide:download',
    action: actions.exportBlog,
  })

  // 导入
  menuItems.push({
    type: 'item',
    id: 'import',
    order: 6,
    label: '导入',
    icon: 'i-lucide:upload',
    action: actions.importBlog,
  })

  // 创建副本
  menuItems.push({
    type: 'item',
    id: 'duplicate',
    order: 7,
    label: '创建副本',
    icon: 'i-lucide:copy',
    action: actions.duplicateBlog,
  })

  // 发布（仅草稿状态的博客）
  if (actions.isDraft || (actions.isApi && actions.blogPost.tags?.includes('DRAFT'))) {
    menuItems.push({
      type: 'item',
      id: 'publish',
      order: 8,
      label: '发布',
      icon: 'i-lucide:send',
      action: actions.publishBlog,
    })
  }

  menuItems.push({
    type: 'separator',
    order: 9,
  })

  // @unocss-include
  menuItems.push({
    type: 'item',
    id: 'delete',
    order: 10,
    label: '删除',
    icon: 'i-lucide:trash',
    class: 'c-red opacity-90 hover:c-red hover:opacity-100',
    action: actions.deleteBlog,
  })
}

// 添加元信息
function addMetaInfo(menuItems: FORUM.TopicDropdownMenu[], blogPost: EnhancedBlogPost) {
  if (!blogPost.contentRaw)
    return

  menuItems.push({
    type: 'separator',
    order: 11,
  })

  // 字数统计
  const wordCount = formatWordCount(blogPost.contentRaw)
  menuItems.push({
    type: 'info',
    id: 'word-count',
    order: 12,
    label: wordCount,
  })

  // 创建者
  if (blogPost.author) {
    menuItems.push({
      type: 'info',
      id: 'author',
      order: 13,
      label: `作者: ${blogPost.author.login}`,
    })
  }

  // 上次编辑时间
  if (blogPost.updatedAt) {
    const updateTime = new Date(blogPost.updatedAt).toLocaleString()
    menuItems.push({
      type: 'info',
      id: 'last-edit',
      order: 14,
      label: `编辑: ${updateTime}`,
    })
  }
}
