import type ForumAPI from '../../.vitepress/theme/apis/forum/api'
import BlogRewrites from '../_data/blogRewrites.json'

import Blog from '../_data/posts.json'
import { getForumLocaleLabelGetter } from '../composables/getForumLocaleGetter'

type BlogRewriteKey = keyof typeof BlogRewrites

interface PostConfig {
  rewriteUrl?: string
}

const localeLabelGetter = getForumLocaleLabelGetter()

export function usePostData(locale: string) {
  return {
    paths() {
      return Blog.filter(
        post =>
          post.tags
          // eslint-disable-next-line unicorn/prefer-includes
          && post.tags.some(
            label =>
              label === localeLabelGetter.getLabel(locale.toUpperCase()),
          ),
      ).map((entry) => {
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
              .map(val => String(val))
              .includes('NO-COMMENT')
              ? -1
              : entry.commentCount,
            rewriteUrl: BlogRewrites[entry.id as BlogRewriteKey],
          } satisfies ForumAPI.PostParams & PostConfig,
          content: entry.contentRaw,
        }
      })
    },
  }
}
