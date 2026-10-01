import type { ComputedRef } from 'vue'
import type { BlogUpdateItem, BlogUpdatePost } from '~/forum/services/blogUpdateFeed'
import { useData } from 'vitepress'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { selectRecentBlogUpdates } from '~/forum/services/blogUpdateFeed'

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
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    now.value = Date.now()
    timer = setInterval(() => {
      now.value = Date.now()
    }, 60_000)
  })
  onUnmounted(() => clearInterval(timer))

  return computed(() => selectRecentBlogUpdates(posts, {
    lang: (lang.value || 'zh').split('-')[0],
    now: now.value,
  }))
}
