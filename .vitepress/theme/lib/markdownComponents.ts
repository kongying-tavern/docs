/**
 * 写进 Markdown 正文的组件（MDC 标签）及其全局注册。
 *
 * 这是唯一来源：`enhanceApp` 调 `installMarkdownComponents` 完成注册，lint 的可见
 * 文本提取也执行同一个函数拿到真实组件，不再解析注册写法或组件路径。
 *
 * 注册到 app 的组件 MDC 都能用，这里只放正文会写的那些；布局、页面与 VitePress
 * 内置组件在 `installLayoutComponents` 注册，两者分开是因为后者的模块树很重。
 */
import type { App } from 'vue'
import { defineAsyncComponent } from 'vue'
import { Kbd, KbdGroup } from '../components/ui/kbd/index.ts'
import { KeyboardShortcut } from '../components/ui/keyboard-shortcut/index.ts'

// 异步入口指向 SFC 本身：目录 barrel 会把同级导出一起打进同一个 chunk。
const AccordionPanels = defineAsyncComponent(() => import('../components/ui/accordion/AccordionPanels.vue'))
const Card = defineAsyncComponent(() => import('../markdown-ext/card/Card.vue'))
const Coins = defineAsyncComponent(() => import('../components/coins/Coins.vue'))
const Emoji = defineAsyncComponent(() => import('../components/ui/emoji/Emoji.vue'))
const LinkGrid = defineAsyncComponent(() => import('../components/ui/link-grid/LinkGrid.vue'))
const QA = defineAsyncComponent(() => import('../markdown-ext/qa/QA.vue'))
const QaGroup = defineAsyncComponent(() => import('../markdown-ext/qa/QaGroup.vue'))
const Placeholder = defineAsyncComponent(() => import('../markdown-ext/placeholder/Placeholder.vue'))
const QQGroupList = defineAsyncComponent(() => import('../components/qq-group-list/QQGroupList.vue'))
const Spoiler = defineAsyncComponent(() => import('../markdown-ext/spoiler/Spoiler.vue'))

/**
 * 注册正文组件。只用到 `app.component`，工具侧可以传轻量替身来收集注册表。
 *
 * 注意：`mdc-metadata` 插件按源码文本收集标签，注册必须写成
 * `app.component('<名字>', <标识符>)` 的字面量形式，不要改成循环或动态名。
 */
export function installMarkdownComponents(app: Pick<App, 'component'>): void {
  app.component('AccordionPanels', AccordionPanels)
  app.component('Coins', Coins)
  app.component('Card', Card)
  app.component('Emoji', Emoji)
  app.component('Kbd', Kbd)
  app.component('KbdGroup', KbdGroup)
  app.component('KeyboardShortcut', KeyboardShortcut)
  // MDC 的 `::QA` 会 kebab 成 `<qa>`，Vue 再按 kebab 找注册名 `Qa`；
  // 注册成 `QA` 永远匹配不上。
  app.component('Qa', QA)
  // 同样由 `:::QAGroup` 变成的 `<qa-group>` 对应 `QaGroup`。
  app.component('QaGroup', QaGroup)
  app.component('Placeholder', Placeholder)
  app.component('QQGroupList', QQGroupList)
  app.component('Spoiler', Spoiler)
  app.component('LinkGrid', LinkGrid)
}
