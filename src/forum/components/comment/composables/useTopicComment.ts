import type ForumAPI from '@/src/forum/api/types.d.ts'
import { computed } from 'vue'
import { data as forumDocumentLinks } from '#data/loader/forumDocumentLinks.data.ts'
import { useForumRoute } from '@/src/forum/hooks/state/useForumRoute.ts'
import { useTopicUserRole } from '@/src/forum/hooks/view/useTopicUserRole.ts'
import { decodeForumText } from '@/src/forum/services/forumContentCodec.ts'
import { renderForumComment } from '@/src/forum/services/forumContentRenderer.ts'

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
