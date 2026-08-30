import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { data as forumDocumentLinks } from '~/_data/forumDocumentLinks.data'
import { useForumRoute } from '~/composables/useForumRoute'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { decodeForumText } from '~/services/forum/forumContentCodec'
import { renderForumComment } from '~/services/forum/forumContentRenderer'

export interface UseTopicCommentOptions {
  commentData: ForumAPI.Comment
  topicAuthorId: string | number
}

export function useTopicComment(options: UseTopicCommentOptions) {
  const { commentData, topicAuthorId } = options
  const { isOfficial } = useRuleChecks()
  const { topicHref } = useForumRoute()
  const content = renderForumComment(decodeForumText(commentData.content.text), {
    topicHref: id => topicHref(id, null),
    documentLinks: forumDocumentLinks,
  })
  const role = computed(() => {
    if (topicAuthorId === commentData.author.id)
      return 'author'
    if (isOfficial(commentData.author.id).value)
      return 'official'
    return null
  })

  return { content, role }
}
