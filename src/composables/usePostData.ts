import type ForumAPI from '../../.vitepress/theme/apis/forum/api'
import Blog from '../_data/posts.json'
import { getForumLocaleLabelGetter } from '../composables/getForumLocaleGetter'

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
      ).flatMap((entry) => {
        const baseItem = {
          params: {
            id: entry.id,
            path: entry.path,
            state: entry.state as ForumAPI.TopicState,
            title: entry.title,
            tags: entry.tags,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            author: entry.author,
            link: entry.link,
            commentCount: entry.tags
              .map(val => String(val))
              .includes('NO-COMMENT')
              ? -1
              : entry.commentCount,
          } satisfies Omit<ForumAPI.Post, | 'contentRaw' | 'content' | 'type' | 'user'>,
          content: entry.contentRaw,
        }

        if (entry.id === entry.path)
          return [baseItem]

        const duplicatedItem = {
          params: {
            ...baseItem.params,
            title: 'Redirect Page',
            id: entry.path,
            path: entry.id,
          },
          content: `<a href="./${entry.path}">Jump to post</a>`,
        }

        return [baseItem, duplicatedItem]
      })
    },
  }
}
