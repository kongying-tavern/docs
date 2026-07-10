---
title: Frontmatter
description: 了解如何在 Markdown 文件中使用 YAML frontmatter 来控制页面级别的元数据和行为。
layout: doc
aside: true
outline: [2, 3]
search: false
prev:
  text: "Markdown 增强语法指南"
  link: "/md-enhance-guide"
head:
  - - meta
    - name: robots
      content: noindex, nofollow
---

<!-- 该页面无需翻译 -->

Frontmatter 是 Vitepress 框架中一种书写于 Markdown 文档顶部，用于调节页面布局或行为的一种配置。Frontmatter 内容由 YAML 语法写成。

## 用法 {#usage}

VitePress 支持在所有 Markdown 文件中使用 YAML frontmatter，并使用 [gray-matter](https://github.com/jonschlinkert/gray-matter) 解析。frontmatter 必须位于 Markdown 文件的顶部 (在任何元素之前，包括 `<script>` 标签)，并且需要在三条虚线之间采用有效的 YAML 格式。例如：

```md
---
title: Docs with VitePress
editLink: true
---
```

许多站点或默认主题配置选项在 frontmatter 中都有相应的选项。可以使用 frontmatter 来覆盖当前页面的特定行为。详细信息请参见 [frontmatter 配置参考](https://vitepress.dev/zh/reference/frontmatter-config)。

还可以定义自己的 frontmatter 数据，以在页面上的动态 Vue 表达式中使用。

## 访问 frontmatter 数据 {#accessing-frontmatter-data}

frontmatter 数据可以通过特殊的 `$frontmatter` 全局变量来访问：

下面的例子展示了应该如何在 Markdown 文件中使用它：

```md
---
title: Docs with VitePress
editLink: true
---

# {{ $frontmatter.title }}

Guide content
```

还可以使用 [`useData()`](https://vitepress.dev/zh/reference/runtime-api#usedata) 辅助函数在 `<script setup>` 中访问当前页面的 frontmatter。

## 其他 frontmatter 格式 {#alternative-frontmatter-formats}

VitePress 也支持 JSON 格式的 frontmatter，以花括号开始和结束：

```json
---
{
  "title": "Blogging Like a Hacker",
  "editLink": true
}
---
```

## 支持的 frontmatter 特殊配置 {#supported-frontmatter-config}

### footer {#fm-footer}

- 类型：`Boolean`
- 默认：`true`
- 描述：是否显示页面的页脚。

```yml
---
footer: false # 隐藏该页面的页脚
---
```

### aside {#fm-aside}

- 类型：`Boolean`
- 默认：`true`
- 描述：是否显示页面的侧边栏。

> 仅会在 `layout: doc` 时自动启用

```yml
---
aside: false # 隐藏该页面的侧比栏
---
```

### outline {#fm-outline}

当 `aside` 为 `true` 时，侧边栏默认显示 2 - 4 级目录。此时，可通过配置 `outline` 配置设置当前文档侧边栏显示的层级。

- 类型：`[Integer, Integer]`
- 默认：`[2, 4]`

```yml
---
aside: true
outline: [2, 3] # 仅显示 2 - 3 级目录
---
```

### wip {#fm-wip}

- 类型：`Boolean`
- 默认：`false`
- 描述：页面顶部是否显示“施工中”的横幅，此配置会覆盖 `banner` 配置。

```yml
---
wip: true # 显示施工中横幅
---
```

### banner {#fm-banner}

- 类型：`String`
- 描述：页面的顶部的横幅文本，支持输入 HTML，不支持 Markdown。配置文本为空或者未配置时隐藏。

```yml
---
banner: 我是Banner
---
```

### bannerExpiryDate {#fm-banner-expiry-date}

- 类型：`Date`
- 描述：页面顶部的横幅的失效日期，需配合 `banner` 配置使用。不设置时横幅文本永久显示。

```yml
---
banner: 服务器维护公告
bannerExpiryDate: 2024-2-1
---
```

### docHeader {#fm-doc-header}

- 类型：`Boolean`
- 默认：`true`
- 描述：是否使用 docHeader 展示标题。

> 仅会在 `layout: doc` 时自动启用

```yml
---
docHeader: false # 隐藏该页面的 docHeader
---
```
