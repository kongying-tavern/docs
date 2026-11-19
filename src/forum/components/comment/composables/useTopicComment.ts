import type ForumAPI from '@/src/forum/api/types'
import { computed } from 'vue'
import { data as forumDocumentLinks } from '@/src/data/forumDocumentLinks.data'
import { useForumRoute } from '@/src/forum/composables/state/useForumRoute'
import { useTopicUserRole } from '@/src/forum/composables/util/useTopicUserRole'
import { decodeForumText } from '@/src/forum/services/forumContentCodec'
import { renderForumComment } from '@/src/forum/services/forumContentRenderer'

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
