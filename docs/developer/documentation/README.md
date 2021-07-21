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

Genshin Map Docs 项目创立于 2021 年六月初，至今已上线 <time> {{ date }} </time> 天。

初衷是为了支持原神地图及其子项目的文档需求。

## 仓库地址

- [GitHub => https://github.com/jiazengp/genshinmap-docs](https://github.com/jiazengp/genshinmap-docs)（主仓库）
- [Gitee => https://gitee.com/KYJGYSDT/yuanshendocs](https://gitee.com/KYJGYSDT/yuanshendocs)（镜像仓库，非实时同步）

## 目录结构

```md
.
├─.editorconfig （编辑器配置文件 https://editorconfig.org/）
├─.eslintrc.yml （ESlint 配置文件 https://cn.eslint.org/docs/user-guide/configuring）
├─.gitattributes （定义每个路径的属性 https://git-scm.com/docs/gitattributes）
├─.gitignore （指定有意忽略的文件 https://git-scm.com/docs/gitignore）
├─.markdownlint.json（MarkdownLint 的配置文件 https://github.com/DavidAnson/markdownlint）
├─.npmrc（npm 的配置 https://docs.npmjs.com/cli/v7/configuring-npm/npmrc）
├─.prettierignore（prettier 的忽略文件配置 https://prettier.io/docs/en/ignore.html）
├─.textlintrc（TextLint 的配置文件 https://textlint.github.io/docs/configuring.html）
├─.travis.yml（TravisCI 的配置文件 https://docs.travis-ci.com/user/customizing-the-build）
├─.yarnrc.yml（Yarn 的配置文件 https://classic.yarnpkg.com/en/docs/yarnrc/）
├─CHANGELOG.md（更新日志）
├─commitlint.config.js（CommitLint 的配置文件 https://commitlint.js.org/）
├─config.ts（全局配置文件）
├─jest.config.js（Jest 的配置文件 https://jestjs.io/docs/configuration）
├─LICENSE（许可证 https://opensource.org/licenses/MIT）
├─package.json（包的描述文件 https://docs.npmjs.com/cli/v6/configuring-npm/package-json）
├─README.md（项目描述文件）
├─README.zh-CN.md（项目中文描述文件）
├─SECURITY.md（安全策略文件 https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository）
├─tsconfig.eslint.json（Ts for Eslint 配置文件 https://github.com/typescript-eslint）
├─tsconfig.json（ts 配置文件 https://www.typescriptlang.org/docs/handbook/tsconfig-json.html）
├─vite.config.ts（Vite 配置文件 https://cn.vitejs.dev/config/）
├─vuepress.config.ts（VuePress2 配置文件 https://vuepress2.netlify.app/zh/reference/config.html）
├─yarn.lock（YarnLock https://classic.yarnpkg.com/en/docs/yarn-lock/）
├─tests（Jest 的测试文件文件夹）
├─public（公共资源目录）
| ├─browserconfig.xml（browserconfig）
| ├─manifest.webmanifest（Web 应用程序清单 https://developer.mozilla.org/zh-CN/docs/Web/Manifest）
├─docs（文档文件目录, 根目录下的为默认语言即中文）
| ├─ja（日语翻译目录）
| ├─en（英文翻译目录）
| ├─developer（开发人员文档）
| | ├─README.md（首页）
| | ├─documentation （文档）
| | | ├─README.md（首页）
| | | ├─update.md（更新日志）
| | | ├─spec（规范目录）
| | | ├─guide（教程目录）
| | ├─backend（上同）
| | ├─frontend（上同）
| ├─announcement（公告文件目录）
| ├─.vuepress
| | ├─clientAppEnhance.ts（https://vuepress2.netlify.app/zh/reference/plugin-api.html#clientappenhancefiles）
| | ├─utils（工具函数目录，包括 dayjs 国际化的配置）
| | ├─theme（本地主题）
| | ├─styles（样式目录）
| | | ├─element-variables.scss（Element-Plus 的样式）
| | | ├─index.scss（主样式 https://vuepress2.netlify.app/zh/reference/default-theme/styles.html#style-%E6%96%87%E4%BB%B6）
| | | ├─palette.scss（palette 的样式 https://vuepress2.netlify.app/zh/reference/default-theme/styles.html#palette-%E6%96%87%E4%BB%B6）
| | | └print.scss（print 时样式）
| | ├─layout（布局）
| | ├─components（组件，该目录下的.vue 文件会被自动注册为全局组件可直接在 Markdown 中使用）
| | ├─api（API 的目录, 包括 Axios 的封装）
| | ├─.temp（临时文件目录）
| | ├─.cache（缓存文件目录）
├─.vscode（VSCode 的配置目录）
| ├─extensions.json（推荐插件 https://code.visualstudio.com/docs/editor/extension-marketplace）
| ├─launch.json（调试的配置文件 https://code.visualstudio.com/docs/editor/debugging）
| └settings.json（配置文件 https://code.visualstudio.com/docs/getstarted/settings）
├─.husky
├─.github
```

::: warning
请留意目目录以及文件名大小写，错误的大小写可能会导致编译失败！
:::

## 注意事项

### 阅读

本指南假设你已了解关于 Markdown、HTML 的中级知识。如果你还不了解这些那么将阅读本指南作为第一步可能不是最好的主意。

### 已废弃的 HTML 标签

已废弃的 HTML 标签默认不允许在本项目中使用，比如 [`<center>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/center) 和 [`<font>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/font) 等。

这些标签不会被 Vue 模板编译器识别成原生 HTML 标签。相反，Vue 会尝试将这些标签解析为 Vue 组件，而显然这些组件通常是不存在的。

## 快速上手

[/developer/documentation/guide/getting-started.html](/developer/documentation/guide/getting-started.md)

## 开发计划

[/developer/documentation/roadmap.html](/developer/documentation/roadmap.md)

## 开发脚本

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

::: warning
这里只列出了一部分你可能会用到的，完整命令见根目录下的 package.json 中的 script。
:::

## 目录

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

### `图标`

- [ElementPlus Icon](https://element-plus.org/#/zh-CN/component/icon)
- [Iconfont Icon](https://yuanshen.site/docs/20210619/demo_index.html)
- [VSCode Icon](https://icones.netlify.app/collection/vscode-icons)

### `原理类`

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
