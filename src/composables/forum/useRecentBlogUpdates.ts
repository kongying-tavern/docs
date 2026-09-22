import type { ComputedRef } from 'vue'
import type { BlogUpdateItem, BlogUpdatePost } from '~/services/forum/blogUpdateFeed'
import { useData } from 'vitepress'
import { computed } from 'vue'
import { selectRecentBlogUpdates } from '~/services/forum/blogUpdateFeed'

/**
 * 首页 aside 的「最近更新」。
 *
 * 窗口按客户端当前时间滚动，条目过期后无需重新构建即会消失；首页与「团队博客」列表互斥，
 * 两处都取自这里以保证判断一致。
 *
 * 文章数据由调用方传入：`~/_data/posts.data` 的具名 `data` 导出由 VitePress 在构建期生成，
 * 本地 `posts.data.ts` 只有 default，`pnpm typecheck` 认不出来，所以导入留在 .vue 里。
 */
export function useRecentBlogUpdates(posts: readonly BlogUpdatePost[]): ComputedRef<BlogUpdateItem[]> {
  const { lang } = useData()

  return computed(() => selectRecentBlogUpdates(posts, {
    lang: (lang.value || 'zh').split('-')[0],
  }))
}
