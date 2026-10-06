import { defineAsyncComponent, shallowRef } from 'vue'

// Keep the resolved component as well as the downloaded module. A warm opening
// can render synchronously instead of entering an async component's fallback.
export const ForumPreloadedRichTextarea = shallowRef(defineAsyncComponent(() => import('../form/ForumRichTextarea.vue')))
export async function preloadForumRichTextarea(): Promise<void> {
  const module = await import('../form/ForumRichTextarea.vue')
  ForumPreloadedRichTextarea.value = module.default
}

export const ForumPreloadedTopicPreviewContent = shallowRef(defineAsyncComponent(() => import('../topic/ForumTopicPreviewContent.vue')))
export async function preloadForumTopicPreviewContent(): Promise<void> {
  const module = await import('../topic/ForumTopicPreviewContent.vue')
  ForumPreloadedTopicPreviewContent.value = module.default
}
