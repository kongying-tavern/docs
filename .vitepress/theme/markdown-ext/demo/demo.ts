import type { PluginSimple } from 'markdown-it'

import { demo } from '@mdit/plugin-demo'

/**
 * `:::: demo` 折叠容器：把示例源码渲染进 <details>，结果与源码分离。
 * 必须在 Comark 之前注册，否则 `:::: demo` 会被当成 MDC 块组件吞掉，
 * 永远到不了 demo 容器插件。
 */
export const MarkdownExtDemo: PluginSimple = (md) => {
  md.use(demo, {
    openRender: () => {
      return '<details class="vp-container vp-md-demo">'
    },
    closeRender: () => {
      return '</details>'
    },
    contentOpenRender: () => {
      return [
        '<summary class="demo-content">',
        '<div class="vp-container-header">',
        '<button type="button" title="toggle" class="vp-md-demo-toggle-button"></button>',
        '</div>',
        '<div class="vp-md-demo-display">',
      ].join('')
    },
    contentCloseRender: () => {
      return [
        '</div>',
        '</summary>',
      ].join('')
    },
  })
}
