import type { GitFileInfo } from '../utils/git'

export interface BlogPost {
  title: string
  url: string
  date: string
  excerpt?: string
  lang: string
  tags?: string[]
  author: {
    name: string
    email: string
    avatar?: string
  }
  gitInfo?: GitFileInfo
  frontmatter: Record<string, unknown>
  filePath: string
}

export interface PostsData {
  all: BlogPost[]
  byLang: {
    zh: BlogPost[]
    en: BlogPost[]
    ja: BlogPost[]
  }
  posts: Array<{
    id: string
    title: string
    createdAt: string
    updatedAt: string
    contentRaw?: string
    path: string
    author: {
      id: number
      username: string
      avatar: string
      login: string
    }
    tags: string[]
  }>
}

declare const data: PostsData

export { data }
