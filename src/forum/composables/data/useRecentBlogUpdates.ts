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
 * 调用方传入 `~/_data/forumBlogPosts.data` 的构建期数据，其中仅保留最新更新及边栏所需元信息。
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
