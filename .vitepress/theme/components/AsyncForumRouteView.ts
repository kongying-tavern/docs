import { defineAsyncComponent } from 'vue'

const loadForumRouteView = () => import('~/components/forum/ForumRouteView.vue')

export const AsyncForumRouteView = defineAsyncComponent(
  loadForumRouteView,
)

export const preloadForumRouteView = loadForumRouteView
