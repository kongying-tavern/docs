/**
 * 布局、页面与 VitePress 内置组件的全局注册。
 *
 * 与 `markdownComponents` 分开：这里的模块树很重（VitePress 内置组件来自默认主题，
 * 布局与页面会拉起整棵页面依赖），而 lint 只需要正文组件的注册表。
 */
import type { App } from 'vue'
import { VPBadge, VPImage, VPLink } from 'vitepress/theme-without-fonts'
import { defineAsyncComponent } from 'vue'
import SettingsPage from '@/src/features/settings/SettingsPage.vue'
import Blog from '../layouts/Blog.vue'
import { AsyncForumRouteView } from '../router/asyncForumRouteView.ts'
import { loadForumLayout } from '../router/forumPreload.ts'

const Forum = defineAsyncComponent(loadForumLayout)
const Headline = defineAsyncComponent(() => import('../layouts/Headline.vue'))
const Post = defineAsyncComponent(() => import('../layouts/Post.vue'))
const Settings = defineAsyncComponent(() => import('../layouts/Settings.vue'))
const ForumLabelAdminPage = defineAsyncComponent(() => import('@/src/forum/components/settings/ForumLabelAdminPage.vue'))
const SitemapPage = defineAsyncComponent(() => import('../components/sitemap-page/SitemapPage.vue'))

/** 注册布局与页面组件。只用到 `app.component`。 */
export function installLayoutComponents(app: Pick<App, 'component'>): void {
  app.component('VPBadge', VPBadge)
  app.component('VPImage', VPImage)
  app.component('VPLink', VPLink)
  app.component('Headline', Headline)
  app.component('Post', Post)
  app.component('Settings', Settings)
  app.component('SettingsPage', SettingsPage)
  app.component('SitemapPage', SitemapPage)
  app.component('ForumLabelAdminPage', ForumLabelAdminPage)
  app.component('Forum', Forum)
  app.component('ForumRouteView', AsyncForumRouteView)
  app.component('Blog', Blog)
}
