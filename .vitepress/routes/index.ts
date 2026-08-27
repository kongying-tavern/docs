import type { LocaleRoute } from './types'
import ForumHome from '~/components/forum/ForumHome.vue'
import ForumTopicPage from '~/components/forum/topic/ForumTopicPage.vue'
import ForumUserPage from '~/components/forum/user/ForumUserPage.vue'
import { createRouteFromComponent } from './utils'

export type { LocaleRoute } from './types'

export const routes: LocaleRoute[] = [
  createRouteFromComponent('feedback{/:type}', ForumHome),
  createRouteFromComponent('feedback/topic/:id', ForumTopicPage),
  createRouteFromComponent('feedback/user/:id{/:type}', ForumUserPage),
] as const
