import type { LocaleSpecificConfig, PageData } from 'vitepress'
import type { Component } from 'vue'
import ForumHome from '~/components/forum/ForumHome.vue'
import ForumTopicPage from '~/components/forum/topic/ForumTopicPage.vue'
import ForumUserPage from '~/components/forum/user/ForumUserPage.vue'

export interface LocaleRoute {
  match: string
  component: Component
  locales?: Record<string, LocaleSpecificConfig>
  options?: Record<string, string[]>
  path?: string
  data?: Partial<PageData>
  i18n?: boolean
}

export const routes: LocaleRoute[] = [
  {
    match: 'feedback{/:type}',
    component: ForumHome,
    i18n: true,
    locales: {
      root: {
        title: '社区反馈',
      },
      ja: {
        title: 'フィードバック',
      },
      en: {
        title: 'Feedback',
      },
    },
    options: {
      type: ['feat', 'closed', 'bug'],
    },
    data: {
      frontmatter: {
        layout: 'Forum',
      },
    },
  },
  {
    match: 'feedback/topic/:id',
    component: ForumTopicPage,
    i18n: true,
  },
  {
    match: 'feedback/user/:id{/:type}',
    options: {
      type: ['feat', 'closed', 'bug'],
    },
    component: ForumUserPage,
    i18n: true,
  },
] as const
