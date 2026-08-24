import type { LocaleRoute } from './types'
import AdminDashboard from '~/components/admin/AdminDashboard.vue'
import { createRouteFromComponent } from './utils'

export type { LocaleRoute } from './types'

export const routes: LocaleRoute[] = [
  createRouteFromComponent('dashboard{/:tab}', AdminDashboard),
] as const
