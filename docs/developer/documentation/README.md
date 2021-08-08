---
title: Documentation
description: Documentation
sidebar:
  [
    { text: '文档规范', link: '/developer/documentation/spec/README.md' },
    { text: '更新日志', link: '/developer/documentation/update.md' },
    { text: '开发计划', link: '/developer/documentation/roadmap.md' },
  ]
---

## 介绍

原神地图文档 项目创立于 2021 年六一儿童节，至今已上线 <time> {{ date }} </time> 天。

初衷是为了支持原神地图及其子项目的文档需求。

::: warning
该项目当前仍然处于 W.I.P.。
:::

## 仓库地址

- [GitHub](https://github.com/jiazengp/genshinmap-docs)（主仓库）
- [Gitee](https://gitee.com/KYJGYSDT/yuanshendocs)（GitHub 的镜像仓库，非实时同步）

## 开发配置

开发要求：

- [Node.js](http://nodejs.org) **version 12+**
- [Yarn v1 classic](https://classic.yarnpkg.com/zh-Hans/docs/install) 或者 [pnpm](https://pnpm.io/)

克隆代码仓库，并安装依赖：

```bash
yarn
# pnpm install
```

监听源文件修改：

```bash
yarn dev
# pnpm dev
```

打开另一个终端，开始开发项目文档网站：

```bash
yarn docs:dev
# pnpm docs:dev
```

本项目开发使用的一些主要工具：

- [TypeScript](https://www.typescriptlang.org/) 作为开发语言
- [Jest](https://jestjs.io/) 用于单元测试
- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) 用于代码检查和格式化

## 注意事项

### 阅读

本指南假设你已了解关于 Markdown、HTML、Sass、Vue3 的中级知识。如果你还不了解这些那么将阅读本指南作为第一步可能不是最好的主意。

### 已废弃的 HTML 标签

已废弃的 HTML 标签默认不允许在本项目中使用，比如 [`<center>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/center) 和 [`<font>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/font) 等。

这些标签不会被 Vue 模板编译器识别成原生 HTML 标签。相反，Vue 会尝试将这些标签解析为 Vue 组件，而显然这些组件通常是不存在的。

## 快速上手

[/developer/documentation/guide/getting-started.html](./guide/getting-started.md)

## 开发计划

[/developer/documentation/roadmap.html](./roadmap.md)

## 常用开发脚本

### `yarn build`

`build` 命令会使用 `tsc` 将 TS 源文件编译为 JS 文件。

### `yarn docs:*`

`docs:` 前缀表明，这些命令是针对文档 (documentation) 进行操作的，即 `docs` 目录。

#### `yarn docs:build`

编译文档来生成文档网站的输出文件。

#### `yarn docs:dev`

在本地启动文档网站开放服务器，支持 docs 目录的热更新。

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

## 文档

地图的文档主题是由自己驱动的，是由该仓库中的源码构建而来。

所有的 Markdown 源文件都放置在 `docs` 目录下。我们维护了两种翻译：

- 中文 (zh-CN) 在 `/` 路径下
- 英语 (en-US) 在 `/en/` 路径下
- 日语 (ja-JP) 在 `/ja/` 路径下

我们部署了两套站点：

- 在 [yuanshen.site](https://yuanshen.site/) 部署的 Release 版本。该站点是从最新发布的版本中构建而来，因此用户不会看到未发布的改动。域名为 [https://yuanshen.site/docs/](https://yuanshen.site/docs/)。
- 在 [GitHub Pages](https://pages.github.com) 部署的 Developer 版本。该站点是从最新的提交中构建而来，因此开发者可以预览最新的改动。域名为 [https://jiazengp.github.io/genshinmap-docs]([https://jiazengp.github.io/genshinmap-docs)。

## 目录

- `用法类`
  - [VuePress2](https://vuepress2.netlify.app/zh/)
    - [Frontmatter 配置](https://vuepress2.netlify.app/zh/reference/default-theme/frontmatter.html)
    - [内置组件](https://vuepress2.netlify.app/zh/reference/components.html#clientonly)
  - [TypeScript](https://www.typescriptlang.org/zh/)
  - [Jest](https://jestjs.io/zh-Hans/)
  - [ESlint](https://eslint.org/)
  - [TextLint](https://textlint.github.io/)
  - [Prettier](https://prettier.io/docs/en/)
  - [Sass](https://sass-lang.com/)
  - [ElementPlus](https://element-plus.org/#/zh-CN/)
  - [VueUse](https://vueuse.org/)
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
- `图标`
  - [ElementPlus](https://element-plus.org/#/zh-CN/component/icon)
  - [Iconfont](https://yuanshen.site/docs/20210619/demo_index.html)
- `原理类`
  - [VuePress2](https://vuepress2.netlify.app/zh/)
    - [本文档是如何工作的](https://vuepress2.netlify.app/zh/guide#它是如何工作的)
    - [核心架构](https://vuepress2.netlify.app/zh/advanced/architecture.html)

## 其他项目

| 项目                 |                       链接                       | 仓库                                                              |
| -------------------- | :----------------------------------------------: | ----------------------------------------------------------------- |
| 空荧地图             | [https://yuanshen.site/](https://yuanshen.site/) | [Gitee](https://gitee.com/KYJGYSDT/yuan-shen-map)                 |
| 空荧地图 VUE 重制版  |                        -                         | [Gitee](https://gitee.com/KYJGYSDT/island_map)                    |
| 空荧地图后台管理系统 |                        -                         | [Gitee](https://gitee.com/KYJGYSDT/manage_system)                 |
| 原神地图自动追踪 dll |                        -                         | [Gitee](https://gitee.com/Yu_Sui_Xian/yuanshen-auto-tracking-dll) |

<script setup>
import { ref } from 'vue';
import dayjs from 'dayjs';

const date = ref(dayjs().diff(dayjs('2021-06-1'), 'day'));
</script>
