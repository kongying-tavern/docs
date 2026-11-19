import { defineAsyncComponent } from 'vue'

const loadForumRouteView = () => import('@/src/forum/components/layout/ForumRouteView.vue')

export const AsyncForumRouteView = defineAsyncComponent(loadForumRouteView)

export const preloadForumRouteView = loadForumRouteView
