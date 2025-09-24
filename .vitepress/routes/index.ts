import type { LocaleRoute } from './types'
import AdminDashboard from '~/components/admin/AdminDashboard.vue'
import ForumHome from '~/components/forum/ForumHome.vue'
import ForumTopicPage from '~/components/forum/topic/ForumTopicPage.vue'
import ForumUserPage from '~/components/forum/user/ForumUserPage.vue'
import { createRouteFromComponent } from './utils'

// 重新导出类型供其他地方使用
export type { LocaleRoute } from './types'

export const routes: LocaleRoute[] = [
  createRouteFromComponent('feedback{/:type}', ForumHome),
  createRouteFromComponent('feedback/topic/:id', ForumTopicPage),
  createRouteFromComponent('feedback/user/:id{/:type}', ForumUserPage),
  createRouteFromComponent('dashboard{/:tab}', AdminDashboard),
] as const
