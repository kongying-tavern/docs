import type { Editor as TiptapEditor } from '@tiptap/core'
import type { BlogDraft } from '~/services/blogDraftDB'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { Editor } from '@tiptap/vue-3'
import { Markdown } from 'tiptap-markdown'
import { useDebounceFn } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
// import { toast } from 'vue-sonner'
import { useBlogDraftStore } from '~/stores/useBlogDraftStore'
// 性能优化：暂时移除重型扩展
// import { EmojiNode } from '~/composables/tiptap/emojiNode'
// import TimelineExtension from '~/composables/tiptap/timelineExtension'
import { useBlogDataFetcher } from './useBlogDataFetcher'
import { useBlogOperations } from './useBlogOperations'

export function useBlogEditor(params?: {
  draftId?: string
  blogId?: string | number
}) {
  // 单一编辑器实例
  const editor = ref<TiptapEditor | null>(null)
  const isReady = ref(false)


  // 编辑器内容
  const blogTitle = ref('')
  const editorContent = ref('')
  const isDataLoaded = ref(false) // 数据加载状态
  const currentDraftId = ref<string | null>(params?.draftId || null)
  const currentBlogId = ref<string | number | null>(params?.blogId || null)

  // 数据获取和管理
  const {
    isLoading: isLoadingData,
    blogData,
    fetchBlogData,
    handlePostPublish,
    _setBlogData,
  } = useBlogDataFetcher()

  const { createPost, updatePost, canManageBlog } = useBlogOperations()

  // 使用 Pinia 草稿状态管理
  const draftStore = useBlogDraftStore()
  const autoSaveStatus = ref('')

  // 操作状态
  const isSaving = ref(false)
  const isPublishing = ref(false)
  const showPreview = ref(false)

  // 通知系统
  const notification = ref<{ type: 'success' | 'error', message: string } | null>(null)

  // 字符计数 - 使用更可靠的响应式机制
  const _characterCount = ref(0)
  const characterCount = computed(() => _characterCount.value)
  const characterLimit = computed(() => 100000) // 博客字数限制

  const isOverLimit = computed(() =>
    characterCount.value > characterLimit.value,
  )

  // 获取当前内容用于保存 - 使用 Markdown 而不是 HTML
  const getCurrentContent = () => {
    return getMarkdownContent()
  }

  // 优化的编辑器内容更新 - 使用 getJSON() 而不是 getHTML() 以提高性能
  const updateEditorContent = useDebounceFn((editor: any) => {
    try {
      // 只在编辑器存在且可编辑时更新
      if (!editor || !editor.isEditable)
        return

      // 使用 getJSON() 替代 getHTML() 以提高性能
      const jsonContent = editor.getJSON()
      const charCount = editor.storage.characterCount?.characters() || 0

      // 检查内容是否为空 - 基于 JSON 结构而不是 HTML
      const isEmpty = !jsonContent
        || !jsonContent.content
        || jsonContent.content.length === 0
        || (jsonContent.content.length === 1
          && jsonContent.content[0].type === 'paragraph'
          && (!jsonContent.content[0].content || jsonContent.content[0].content.length === 0))

      // 批量更新 reactive 数据以减少重渲染
      // 存储 JSON 格式而不是 HTML 以提高性能
      editorContent.value = isEmpty ? '' : JSON.stringify(jsonContent)

      // 使用节流更新字符计数以减少频繁状态更新
      throttledCharacterUpdate(charCount)

      // 触发防抖的自动保存
      debouncedAutoSave()
    }
    catch (error) {
      console.error('Editor content update error:', error)
    }
  }, 150) // 减少防抖时间以提高响应性，但仍避免过度更新

  // 发布条件
  const canPublish = computed(() => {
    const currentContent = getCurrentContent()
    return blogTitle.value.trim().length > 0
      && currentContent.trim().length > 0
      && characterCount.value <= characterLimit.value
      && canManageBlog.value
  })

  // 初始化编辑器
  function initializeEditor(initialContent: string = ''): void {
    // 销毁旧编辑器（如果存在）
    if (editor.value) {
      editor.value.destroy()
    }

    // 创建 Markdown 编辑器
    editor.value = new Editor({
      extensions: [
        StarterKit.configure({
          // 禁用默认的 Link 扩展，使用自定义的 Link 扩展
          link: false,
          // 启用硬换行，让单个回车就换行
          hardBreak: {
            keepMarks: false,
          },
          // 配置段落换行
          paragraph: {
            HTMLAttributes: {
              style: 'margin: 0; padding: 0;',
            },
          },
        }),
        CharacterCount.configure({
          limit: characterLimit.value,
        }),
        Placeholder.configure({
          placeholder: '开始编写你的博客内容...',
        }),
        Markdown.configure({
          html: false, // 禁用 HTML 以提高性能
          transformPastedText: true, // 允许粘贴 Markdown
          transformCopiedText: true, // 复制时转换为 Markdown
          breaks: true, // 支持换行符转换
          // 性能优化配置
          linkify: false, // 禁用自动链接检测以提高性能
          typographer: false, // 禁用排版转换以提高性能
        }),
      ],
      content: initialContent || undefined, // 直接使用原始 Markdown 内容
      editable: true,
      // 性能优化配置
      parseOptions: {
        preserveWhitespace: 'full', // 保留所有空白符以正确显示 Markdown
      },
      // 启用事务优化
      enableInputRules: true,
      enablePasteRules: true,
      // Vue 3 性能优化 - 减少不必要的重渲染
      injectCSS: false, // 禁用自动 CSS 注入以提高性能
      onCreate: ({ editor }) => {
        // 使用 getJSON() 而不是 getHTML() 以提高性能
        const jsonContent = editor.getJSON()
        const charCount = editor.storage.characterCount?.characters() || 0

        // 基于 JSON 结构的空内容检查
        const isEmpty = !jsonContent
          || !jsonContent.content
          || jsonContent.content.length === 0
          || (jsonContent.content.length === 1
            && jsonContent.content[0].type === 'paragraph'
            && (!jsonContent.content[0].content || jsonContent.content[0].content.length === 0))

        editorContent.value = isEmpty ? '' : JSON.stringify(jsonContent)
        _characterCount.value = charCount
        isReady.value = true
      },
      onUpdate: ({ editor }) => {
        updateEditorContent(editor)
      },
    })
  }

  // 节流的字符计数更新，减少频繁状态更新
  const throttledCharacterUpdate = useDebounceFn((count: number) => {
    _characterCount.value = count
  }, 100)

  // 防抖自动保存
  const debouncedAutoSave = useDebounceFn(async () => {
    // 如果是已发布内容且没有修改权限，跳过自动保存
    if (blogData.value?.isPublished && !canManageBlog.value) {
      return
    }

    const currentContent = getCurrentContent()
    if (!blogTitle.value.trim() && !currentContent.trim()) {
      return
    }

    // 保存富文本编辑器内容
    let contentJson = ''
    let markdownContent = currentContent

    if (editor.value) {
      // 保存JSON和Markdown
      contentJson = JSON.stringify(editor.value.getJSON())
      markdownContent = getMarkdownContent()
    }

    try {
      // 只有草稿或新内容才进行本地自动保存
      if (!blogData.value?.isPublished) {
        const savedDraftId = await draftStore.autoSave(
          currentDraftId.value,
          blogTitle.value,
          markdownContent, // 保存 Markdown 内容
          contentJson,
          ['BLOG', 'DRAFT'],
        )

        if (savedDraftId && !currentDraftId.value) {
          currentDraftId.value = savedDraftId
        }

        autoSaveStatus.value = `自动保存于 ${new Date().toLocaleTimeString()}`
      }
      else {
        // 已发布内容显示不同状态
        autoSaveStatus.value = '正在编辑已发布内容'
      }

      // 清除状态提示
      setTimeout(() => {
        autoSaveStatus.value = ''
      }, 3000)
    }
    catch (error) {
      console.error('自动保存失败:', error)
    }
  }, 2000) // 2秒自动保存

  // 处理标题变化
  const handleTitleChange = () => {
    debouncedAutoSave()
  }

  // 处理纯文本模式下的内容变化
  const handleMarkdownChange = () => {
    debouncedAutoSave()
  }

  // 预览博客
  const previewBlog = () => {
    showPreview.value = true
  }

  // 手动保存草稿
  const saveDraft = async () => {
    if (!blogTitle.value.trim() && !editorContent.value.trim()) {
      showNotification('error', '请输入标题或内容后再保存')
      return
    }

    isSaving.value = true

    try {
      const contentJson = editor.value ? JSON.stringify(editor.value.getJSON()) : ''
      const markdownContent = getMarkdownContent()

      const savedDraftId = await draftStore.autoSave(
        currentDraftId.value,
        blogTitle.value,
        markdownContent, // 保存 Markdown 内容
        contentJson,
        ['BLOG', 'DRAFT'],
      )

      if (savedDraftId && !currentDraftId.value) {
        currentDraftId.value = savedDraftId
      }

      showNotification('success', '草稿已保存')
    }
    catch (error) {
      showNotification('error', '保存草稿失败')
      console.error('保存草稿失败:', error)
    }
    finally {
      isSaving.value = false
    }
  }


  // 获取 Markdown 内容（用于 API 提交）- 直接获取Markdown
  const getMarkdownContent = (): string => {
    if (!editor.value)
      return ''

    try {
      // 使用Markdown扩展直接获取Markdown内容
      return editor.storage.markdown.getMarkdown()
    }
    catch (error) {
      console.warn('Failed to get markdown content:', error)
      return ''
    }
  }

  // 发布博客
  const publishBlog = async () => {
    if (!canPublish.value) {
      showNotification('error', '请检查标题、内容和权限')
      return
    }

    isPublishing.value = true

    try {
      let result
      const markdownContent = getMarkdownContent()

      // 如果是编辑已发布内容，使用更新接口
      if (currentBlogId.value && blogData.value?.isPublished) {
        result = await updatePost(currentBlogId.value, {
          title: blogTitle.value.trim(),
          body: markdownContent, // 使用 Markdown 格式
          labels: ['BLOG'],
        })
      }
      else {
        // 新建或草稿发布
        result = await createPost({
          title: blogTitle.value.trim(),
          body: markdownContent, // 使用 Markdown 格式
          labels: ['BLOG'],
        })
      }

      if (result) {
        const action = currentBlogId.value && blogData.value?.isPublished ? '更新' : '发布'
        showNotification('success', `博客${action}成功！`)

        // 发布后处理：清理草稿并切换到已发布版本
        const publishedData = await handlePostPublish(currentDraftId.value, result)

        // 更新编辑器状态
        currentDraftId.value = null
        currentBlogId.value = result.id
        _setBlogData(publishedData)

        // 短暂延迟后跳转
        setTimeout(() => {
          window.location.href = '/blog'
        }, 1500)
      }
      else {
        showNotification('error', '博客操作失败')
      }
    }
    catch (error) {
      showNotification('error', '博客操作失败')
      console.error('博客操作失败:', error)
    }
    finally {
      isPublishing.value = false
    }
  }

  // 加载草稿
  const loadDraft = async (draft: BlogDraft) => {
    try {
      blogTitle.value = draft.title
      editorContent.value = draft.content
      currentDraftId.value = draft.id || null

      // 更新编辑器内容
      if (editor.value) {
        if (draft.contentJson) {
          try {
            const jsonContent = JSON.parse(draft.contentJson)
            editor.value.commands.setContent(jsonContent)
          }
          catch {
            // 如果 JSON 解析失败，直接使用 Markdown 原文
            editor.value.commands.setContent(draft.content || '')
          }
        }
        else {
          // 直接使用 Markdown 原文，让 TipTap Markdown 扩展处理
          editor.value.commands.setContent(draft.content || '')
        }
      }

      showNotification('success', '草稿已加载')
    }
    catch (error) {
      showNotification('error', '加载草稿失败')
      console.error('加载草稿失败:', error)
    }
  }

  // 清空编辑器
  const clearEditor = () => {
    blogTitle.value = ''
    editorContent.value = ''
    currentDraftId.value = null
    editor.value?.commands.clearContent()
  }

  // 加载最近草稿 - 使用 Pinia store
  const loadRecentDrafts = async () => {
    try {
      await draftStore.fetchDrafts()
    }
    catch (error) {
      console.error('加载草稿列表失败:', error)
    }
  }

  // 显示通知
  const showNotification = (type: 'success' | 'error', message: string) => {
    notification.value = { type, message }
    setTimeout(() => {
      notification.value = null
    }, 3000)
  }

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  // 智能数据加载
  const loadBlogData = async (params?: { draftId?: string, blogId?: string }) => {
    // 如果传递了参数，更新内部状态
    if (params?.draftId !== undefined) {
      currentDraftId.value = params.draftId || null
    }
    if (params?.blogId !== undefined) {
      currentBlogId.value = params.blogId || null
    }

    try {
      const data = await fetchBlogData({
        draftId: currentDraftId.value || undefined,
        blogId: currentBlogId.value || undefined,
      })

      if (data) {
        blogTitle.value = data.title

        let editorInitialContent = ''

        // 如果有 JSON 内容（草稿），优先使用 JSON 内容
        if (data.contentJson) {
          try {
            editorInitialContent = JSON.parse(data.contentJson)
          }
          catch {
            // JSON 解析失败，直接使用 Markdown 原文
            editorInitialContent = data.content || ''
          }
        }
        else {
          // 直接使用 Markdown 原文，让 TipTap Markdown 扩展处理
          editorInitialContent = data.content || ''
        }

        initializeEditor(editorInitialContent)
        isDataLoaded.value = true
        _setBlogData(data)
      }
    }
    catch (error) {
      console.error('Blog data loading error:', error)
    }
  }

  // 监听参数变化
  watch(
    () => ({ draftId: params?.draftId, blogId: params?.blogId }),
    async (newParams) => {
      currentDraftId.value = newParams.draftId || null
      currentBlogId.value = newParams.blogId || null
      await loadBlogData()
    },
    { immediate: true },
  )

  // 生命周期
  onMounted(async () => {
    await loadRecentDrafts()

    // 如果没有待加载的数据（新建博客），直接初始化空编辑器
    if (!currentDraftId.value && !currentBlogId.value) {
      initializeEditor('')
      isDataLoaded.value = true
    }
    // 有数据的情况在 watch 中处理
  })

  onBeforeUnmount(() => {
    // 销毁编辑器
    if (editor.value) {
      editor.value.destroy()
      editor.value = null
    }
  })

  return {
    // 编辑器状态
    editor,
    isReady,
    blogTitle,
    editorContent,
    characterCount,
    characterLimit,
    isOverLimit,

    // 功能
    getCurrentContent,

    // 数据状态
    isLoadingData,
    isDataLoaded,
    blogData,
    currentDraftId,
    currentBlogId,

    // 草稿相关 - 使用 Pinia store
    recentDrafts: draftStore.recentDrafts,
    draftCount: draftStore.draftCount,
    isDraftLoading: draftStore.isLoading,
    autoSaveStatus,

    // 操作状态
    canPublish,
    canManageBlog,
    isSaving,
    isPublishing,

    // 预览
    showPreview,

    // 通知
    notification,

    // 方法
    handleTitleChange,
    handleMarkdownChange,
    previewBlog,
    saveDraft,
    publishBlog,
    loadDraft,
    clearEditor,
    loadRecentDrafts,
    formatDate,
    loadBlogData,
    getMarkdownContent,
  }
}
