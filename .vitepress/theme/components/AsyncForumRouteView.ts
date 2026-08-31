import { defineAsyncComponent } from 'vue'

export const AsyncForumRouteView = defineAsyncComponent(
  () => import('~/components/forum/ForumRouteView.vue'),
)
