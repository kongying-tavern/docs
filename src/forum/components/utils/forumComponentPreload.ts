import { defineAsyncComponent, shallowRef } from 'vue'
import { defineRecoverableAsyncComponent } from '~/components/defineRecoverableAsyncComponent'

// Keep the resolved component as well as the downloaded module. A warm opening
// can render synchronously instead of entering an async component's fallback.
export const ForumPreloadedRichTextarea = shallowRef(defineAsyncComponent(() => import('../form/ForumRichTextarea.vue')))
export async function preloadForumRichTextarea(): Promise<void> {
  const module = await import('../form/ForumRichTextarea.vue')
  ForumPreloadedRichTextarea.value = module.default
}

export const ForumPreloadedCommentArea = shallowRef(defineRecoverableAsyncComponent(() => import('../comment/ForumCommentArea.vue')))
export async function preloadForumCommentArea(): Promise<void> {
  const module = await import('../comment/ForumCommentArea.vue')
  ForumPreloadedCommentArea.value = module.default
}
