import { defineAsyncComponent } from 'vue'

const loadForumRouteView = () => import('~/forum/components/layout/ForumRouteView.vue')

export const AsyncForumRouteView = defineAsyncComponent(loadForumRouteView)

export const preloadForumRouteView = loadForumRouteView
