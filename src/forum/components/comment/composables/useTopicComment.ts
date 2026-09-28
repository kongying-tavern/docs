import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { data as forumDocumentLinks } from '~/_data/forumDocumentLinks.data'
import { useForumRoute } from '~/forum/composables/useForumRoute'
import { useTopicUserRole } from '~/forum/composables/useTopicUserRole'
import { decodeForumText } from '~/forum/services/forumContentCodec'
import { renderForumComment } from '~/forum/services/forumContentRenderer'

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
