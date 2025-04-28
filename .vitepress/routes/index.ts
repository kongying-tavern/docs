import type { PageData } from 'vitepress'
import type { Component } from 'vue'
import ForumTopicPage from '~/components/forum/topic/ForumTopicPage.vue'
import ForumUserPage from '~/components/forum/user/ForumUserPage.vue'

export interface LocaleRoute {
  match: string
  component: Component
  path?: string
  data?: PageData
  i18n?: boolean
}

export const routes: LocaleRoute[] = [
  {
    match: 'feedback/topic/:id',
    component: ForumTopicPage,
    i18n: true,
  },
  {
    match: 'feedback/:id',
    component: ForumUserPage,
    i18n: true,
  },
]
