import Blog from '../../_data/posts.json'

import type ForumAPI from '../../../.vitepress/theme/apis/forum/api'

export default {
  async paths() {
    return Blog.map((entry) => {
      return {
        params: {
          id: entry.id,
          state: entry.state as ForumAPI.TopicState,
          title: entry.title,
          tags: entry.tags,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          author: entry.user,
          link: entry.link,
          commentCount: entry.tags
            .map((val) => String(val))
            .includes('NO-COMMENT')
            ? -1
            : entry.commentCount,
        } satisfies ForumAPI.PostParams,
        content: entry.contentRaw,
      }
    })
  },
}
