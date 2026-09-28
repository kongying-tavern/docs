import type ForumAPI from '~/forum/api/types'
import { computed } from 'vue'
import { data as forumDocumentLinks } from '~/_data/forumDocumentLinks.data'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { useTopicUserRole } from '~/forum/composables/util/useTopicUserRole'
import { decodeForumText } from '~/forum/services/contentCodec'
import { renderForumComment } from '~/forum/services/contentRenderer'

export interface UseTopicCommentOptions {
  commentData: ForumAPI.Comment
  topicAuthorId: string | number
}

export function useTopicComment(options: UseTopicCommentOptions) {
  const { commentData, topicAuthorId } = options
  const { resolveRole } = useTopicUserRole()
  const { topicHref } = useForumRoute()
  const content = renderForumComment(decodeForumText(commentData.content.text), {
    topicHref: id => topicHref(id, null),
    documentLinks: forumDocumentLinks,
  })
  const role = computed(() => resolveRole(topicAuthorId, commentData.author.id))

  return { content, role }
}
