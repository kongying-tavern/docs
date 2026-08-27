import type { GitFileInfo } from './git'
import type ForumAPI from '@/apis/forum/api'
import { join } from 'node:path'
import { createContentLoader } from 'vitepress'
import { BLOG_POST_ORDER } from '../constants/blog'
import { parseAuthors } from './frontmatter'
import { getGitFileInfo } from './git'

/** Matches language path in blog URLs */
const BLOG_LANGUAGE_PATH_REGEX = /^\/([^/]+)\/blog\/posts\//

export interface BlogPost {
  title: string
  url: string
  date: string
  excerpt?: string
  content?: string
  lang: string
  tags?: string[]
  authors: ForumAPI.User[]
  gitInfo?: GitFileInfo
  frontmatter: Record<string, unknown>
  filePath: string
}

/**
 * 提取URL路径中的语言信息
 */
function extractLanguageFromUrl(url: string): string {
  const pathMatch = url.match(BLOG_LANGUAGE_PATH_REGEX)
  return pathMatch ? pathMatch[1] : 'zh'
}

/**
 * 构建文件路径
 */
function buildFilePath(url: string): string {
  // eslint-disable-next-line node/prefer-global/process
  return join(process.cwd(), `${url.replace('/src/', 'src/')}.md`)
}

/**
 * 提取自定义摘要内容
 * 从第一个 ---- 到 <!-- more --> 之间的内容，保持原始 Markdown 格式
 */
function extractCustomExcerpt(content: string): string | undefined {
  if (!content)
    return undefined

  // 查找第一个 ---- 的位置
  const firstDashIndex = content.indexOf('----')
  if (firstDashIndex === -1)
    return undefined

  // 查找 <!-- more --> 的位置
  const moreIndex = content.indexOf('<!-- more -->')
  if (moreIndex === -1)
    return undefined

  // 提取中间的内容
  const startIndex = firstDashIndex + 4 // 跳过 ----
  const excerptContent = content.slice(startIndex, moreIndex).trim()

  if (!excerptContent)
    return undefined

  return excerptContent
}

/**
 * 按配置的固定顺序计算文章位置；未配置的文章排在其后
 */
function getConfiguredOrderIndex(lang: string, url: string): number {
  const orderedSlugs = BLOG_POST_ORDER[lang] ?? []
  const slug = url.slice(url.lastIndexOf('/') + 1)
  const index = orderedSlugs.indexOf(slug)
  return index === -1 ? orderedSlugs.length : index
}

/**
 * 创建博客数据加载器
 * @param pattern 文件路径模式，如 'src/zh/blog/posts/*.md'
 * @returns VitePress ContentLoader
 */
export function createBlogLoader(pattern: string) {
  return createContentLoader(pattern, {
    includeSrc: true,
    excerpt: true,
    transform: async (rawData) => {
      const blogPosts: BlogPost[] = []

      // 并行处理所有页面以提高性能
      const promises = rawData.map(async (page) => {
        try {
          const lang = extractLanguageFromUrl(page.url)
          const filePath = buildFilePath(page.url)

          // 并行获取Git信息和解析作者
          const [gitInfo, authors] = await Promise.all([
            getGitFileInfo(filePath),
            Promise.resolve(parseAuthors(page.frontmatter || {})),
          ])

          // 提取自定义摘要，如果没有则使用 VitePress 默认摘要
          const customExcerpt = extractCustomExcerpt(page.src || '')
          const excerpt = customExcerpt || page.excerpt

          const blogPost: BlogPost = {
            title: page.frontmatter?.title || 'Untitled',
            url: page.url,
            date: gitInfo?.firstCommit?.date || new Date().toISOString(),
            excerpt,
            content: page.src,
            lang,
            tags: Array.isArray(page.frontmatter?.tags) ? page.frontmatter.tags : [],
            authors,
            gitInfo: gitInfo || undefined,
            frontmatter: page.frontmatter || {},
            filePath,
          }

          return blogPost
        }
        catch (error) {
          // eslint-disable-next-line no-console
          console.warn(`Skipping blog post due to error: ${page.url}`, error)
          return null
        }
      })

      const results = await Promise.all(promises)

      // 过滤掉失败的结果并按配置的固定顺序（语言内）排序
      results
        .filter((post): post is BlogPost => post !== null)
        .forEach(post => blogPosts.push(post))

      return blogPosts.toSorted((a, b) => {
        const byLang = a.lang.localeCompare(b.lang)
        if (byLang !== 0)
          return byLang

        const orderDiff = getConfiguredOrderIndex(a.lang, a.url) - getConfiguredOrderIndex(b.lang, b.url)
        if (orderDiff !== 0)
          return orderDiff

        // 未配置的文章按发布日期倒序
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
    },
  })
}
