---
title: Documentation
description: Documentation
sidebar:
  [
    { text: "文档规范", link: "/developer/documentation/spec/README.md" },
    { text: "更新日志", link: "/developer/documentation/update.md" },
  ]
---

## 快速上手

本章是由 `(^_^)` 撰写, 面向地图的的小伙伴。目前内容可能仅适用于本项目。

通过阅读本章内容，快速上手本文档。

## 注意事项

### 已废弃的 HTML 标签

已废弃的 HTML 标签默认不允许在本项目中使用，比如 [`<center>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/center) 和 [`<font>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/font) 等。

这些标签不会被 Vue 模板编译器识别成原生 HTML 标签。相反，Vue 会尝试将这些标签解析为 Vue 组件，而显然这些组件通常是不存在的。

## 相关链接

### `用法类`

- [VuePress-Next](https://vuepress2.netlify.app/zh/)
  - [Frontmatter 配置](https://vuepress2.netlify.app/zh/reference/default-theme/frontmatter.html)
  - [内置组件](https://vuepress2.netlify.app/zh/reference/components.html#clientonly)
- [TypeScript](https://www.typescriptlang.org/zh/)
- [Jest](https://jestjs.io/zh-Hans/)
- [ESlint](https://eslint.org/)
- [TextLint](https://textlint.github.io/)
- [Prettier](https://prettier.io/docs/en/)
- [Sass](https://sass-lang.com/)
- [Axios](https://axios-http.com/)
- [ElementPlus](https://element-plus.org/#/zh-CN/)
- [Markdown](https://zh.wikipedia.org/wiki/Markdown)
  - [将当前页的目录添加到 Markdown 的内容](https://vuepress2.netlify.app/zh/guide/markdown.html#%E7%9B%AE%E5%BD%95)
  - [Markdown 中引用静态资源](https://vuepress2.netlify.app/zh/guide/assets.html#%E9%9D%99%E6%80%81%E8%B5%84%E6%BA%90)
  - [Markdown 中的链接](https://vuepress2.netlify.app/zh/guide/markdown.html#%E9%93%BE%E6%8E%A5)
  - [Markdown 中的代码块/导入代码块](https://vuepress2.netlify.app/zh/guide/markdown.html#%E4%BB%A3%E7%A0%81%E5%9D%97)
  - [Markdown 中使用 Emoji](https://vuepress2.netlify.app/zh/guide/markdown.html#emoji)
  - [Markdown 中使用 Vue3](https://vuepress2.netlify.app/zh/guide/markdown.html#%E5%9C%A8-markdown-%E4%B8%AD%E4%BD%BF%E7%94%A8-vue)
  - [Markdown 中使用 TeX](./guide/tex.md)
  - [Markdown 中使用 Presentation](./guide/presentation.md)
  - [Markdown 中使用 Mermaid](./guide/mermaid.md)
  - [Markdown 中使用 Task list，Footnote，Custom alignment，Custom Containers，Superscript and Subscript，Markup](./guide/other.md)
- [Vue3](https://v3.cn.vuejs.org/guide/introduction.html)

#### 图标的使用

- [ElementPlus-Icon](https://element-plus.org/#/zh-CN/component/icon)
- [Iconfont-Icon](https://yuanshen.site/docs/20210619/demo_index.html)

### `原理类`

- [VuePress-Next](https://vuepress2.netlify.app/zh/)
  - [本文档是如何工作的](https://vuepress2.netlify.app/zh/guide#它是如何工作的)
  - [核心架构](https://vuepress2.netlify.app/zh/advanced/architecture.html)

## 开发脚本

### `yarn build`

`build` 命令会使用 `tsc` 将 TS 源文件编译为 JS 文件。

### `yarn docs:*`

#### `yarn docs:build`,`yarn docs:build2`, `yarn docs:dev`

`docs:` 前缀表明，这些命令是针对文档 (documentation) 进行操作的，即 `docs` 目录。

`docs:build` 为 CI 使用, 生产环境部署或者 CD 请用 `docs:build2`

#### `yarn docs:serve`

在本地启动文档网站服务器。

你需要先运行 `yarn docs:build2` 来生成文档网站的输出文件，然后再通过该命令来启动文档网站。

### `yarn test`

`test` 命令使用 Jest 来运行单元测试。

### `yarn commit`

`commit` 命令使用 git-cz 来规范提交

### `yarn preview`, `yarn preview-https`

`preview` 命令使用 vite 来打包后的本地预览, 仅用于开发

`preview-https` 命令使用 https-localhost 生成 localhost 的 ssl 证书为提供本地做 ssl 预览, 仅用于开发
