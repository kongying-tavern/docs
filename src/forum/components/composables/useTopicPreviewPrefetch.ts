import type ForumAPI from '~/forum/api/types'
import { ref } from 'vue'
import { useForumCommentsQuery } from '~/forum/composables/data/useForumQueries'
import { preloadForumCommentArea } from '../utils/forumComponentPreload'

/** Warm the same comment cache used by both topic previews and image side panels. */
export function useTopicPreviewPrefetch() {
  const topicId = ref('')
  const comments = useForumCommentsQuery({ topicId, repo: 'Feedback', enabled: true })

  return (topic: ForumAPI.Topic | undefined): void => {
    if (!topic || topic.commentCount < 0)
      return
    void preloadForumCommentArea().catch(() => {})
    topicId.value = String(topic.id)
    void comments.refresh()
  }
}
