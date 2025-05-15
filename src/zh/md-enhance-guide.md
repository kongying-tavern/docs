---
title: Markdown 增强语法指南
layout: doc
aside: true
search: false
---

<!-- 该页面无需翻译 -->

本项目文档页面使用Markdown语法进行编写，除了 Vitepress 支持的 Markdown 基础组件之外我们额外添加和实现了一些特有语法和组件并在此演示。

## Timeline 时间线 {#timeline}

```md
::: timeline 2023-05-24

- **do some thing1**
- do some thing2

:::

::: timeline 2023-05-23

- do some thing3
- do some thing4

:::
```

::: timeline 2023-05-24

- **do some thing1**
- do some thing2

:::

::: timeline 2023-05-23

- do some thing3
- do some thing4

:::

## Kbd 快捷键 {#kbd}

快捷方式组件建立在 Kbd 组件之上，可帮助您在内容中显示键盘快捷方式。

```md
[[Meta]][[K]]
```

[[Meta]][[K]]

## Footnote 脚注 {#footnote}

- 在 Markdown 中使用 [^锚点文字] 来定义脚注。
- 在之后的任何位置使用 [^锚点文字]: ... 来描述脚注内容。
- 如果脚注包含多个段落，其后的段落应当保持双层缩进

#### 例子 {#footnote-example}

脚注 1 链接 [^first]。

脚注 2 链接 [^second]。

行内的脚注^[行内脚注文本] 定义。

重复的页脚定义 [^second]。

[^first]: 脚注**可以包含特殊标记**

    也可以由多个段落组成

[^second]: 脚注文字。

```md
脚注 1 链接[^first]。

脚注 2 链接[^second]。

行内的脚注^[行内脚注文本] 定义。

重复的页脚定义[^second]。

[^first]: 脚注 **可以包含特殊标记**

    也可以由多个段落组成

[^second]: 脚注文字。
```

## Mark 标记 {#mark}

使用 == == 进行标记。请注意两边需要有空格。

#### 例子 {#mark-example}

对于习惯了传统吟游诗人的蒙德来说， ==“偶像”== 是还不习惯的新生事物。但在蒙德，人人都爱芭芭拉。

```md
对于习惯了传统吟游诗人的蒙德来说， ==「偶像」== 是还不习惯的新生事物。但在蒙德，人人都爱芭芭拉。
```

---

## Card 卡片 {#card}

### Props {#card-props}

| 接口        | 描述                                             | 默认值 |       类型        |
| ----------- | :----------------------------------------------- | :----: | :---------------: |
| title       | 卡片标题，必填项                                 |   -    |     `String`      |
| desc        | 卡片描述，为空时默认显示为 link                  |  link  |     `String`      |
| link        | 卡片跳转链接，非必填                             |   -    |     `String`      |
| logo        | 卡片下方Logo的链接，非比填。填self默认为空荧logo |   -    |     `String`      |
| theme       | 卡片主题，非必填                                 | normal | `normal`or`media` |
| color       | 卡片链颜色，非必填                               | normal |     `String`      |
| cover       | 卡片封面链接，非必填。仅在normal主题生效         |   -    |     `String`      |
| hoverShadow | 是否启用卡片 hover 时阴影效果，默认不启用        | false  |     `Boolean`     |
| shadow      | 是否启用卡片阴影效果，默认启用                   |  true  |     `Boolean`     |

> B 站，百度，QQ，米游社，Youtube，X，Reddit，反馈平台的链接可以自动识别，无需手动填写 logo

### Example {#card-example}

> Normal Theme

```card
logo: self
title: That normal theme card
desc: This is description
cover: https://upload-bbs.miyoushe.com/upload/2024/02/21/292762008/86d3c06e1a1adf7ef432cf838f7abb8c_7693471731342377565.png?x-oss-process=image/resize,s_500/quality,q_80/auto-orient,0/interlace,1/format,jpg
```

```card
logo: self
title: That normal theme card
desc: No cover
```

````md
```card
logo: self
title: This normal theme card but no cover
desc: No cover
cover: https://upload-bbs.miyoushe.com/upload/2024/02/21/292762008/86d3c06e1a1adf7ef432cf838f7abb8c_7693471731342377565.png?x-oss-process=image/resize,s_500/quality,q_80/auto-orient,0/interlace,1/format,jpg
```

```card
logo: self
title: This normal theme card
description: i am description
```
````

> Medium Theme

```card
title: 观看客户端基础使用教程
link: https://www.bilibili.com/video/BV1uU4y157Te
theme: medium
```

```card
title: 网页版地图
link: https://yuanshen.site/
logo: self
desc: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
theme: medium
```

````md
```card
title: 观看客户端基础使用教程
link: https://www.bilibili.com/video/BV1uU4y157Te
theme: medium
```

```card
title: 网页版地图
link: https://yuanshen.site/
desc: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
theme: medium
```
````

## 变量声明 {#variable}

用于声明并使用可重复使用的 Markdown 部分

声明时使用以下语法，此语句不会产生任何内容

- 示例中 `KEY` 为变量名，
- 变量名前后可加空格
- 变量名仅可包含字母数字与下划线

```md
{define:KEY}_被声明的内容_{/define}
```

{define:KEY} _被声明的内容_ {/define}

使用变量声明时，使用以下语法

- 变量名前后可加空格

```md
{%= KEY %}
```

{%= KEY %}

## Spoiler 文本遮罩 {#spolier}

用于隐藏内容的插件

使用 !! !! 进行标记。

输入!!xxx!!显示彩蛋

```md
输入!!xxx!!显示彩蛋
```

## Custom Color 自定义文字颜色 {#custom-color}

用于设置文字颜色的插件

```md
{color:#FF5733}红橙色文字{/color} 普通文字 {color:#33FF57}绿色文字{/color}

{color:red}红色文字{/color}

{color: var(--vp-c-purple-3)}_使用CSS Var的紫色文字_{/color}

{color: rgba(44,195,184,1)}**使用RGBA的青色文字**{/color}
```

{color:#FF5733} 红橙色文字 {/color} 普通文字 {color:#33FF57} 绿色文字 {/color}

{color: red} 红色文字 {/color}

{color: var(--vp-c-purple-3)} _使用 CSS Var 的紫色文字_ {/color}

{color: rgba(44,195,184,1)} **使用 RGBA 的青色文字** {/color}

## markdownItAttrs

<https://www.npmjs.com/package/markdown-it-attrs>

### Demo

paragraph *style me*{.vp-link} more text

```markdown
paragraph *style me*{.vp-link} more text
```

## Mention

在输入 @xxx 时，插件将自动通过 src 下 _data 目录中团队成员的 Gitee 账号数据 JSON 中的 username/login 识别转换

### Demo

@kongying-demo

```markdown
@kongying-demo
```

## Emoji

### 语法

:preset/emoji.资源后缀名:

> preset 为 `src/public/emojis` 下的子目录名，每一个子目录对应的一个 Preset。emoji为该 preset 下这个 emoji 的文件名
>
> 新建 Preset/Emoji 只需要在 `src/public/emojis` 目录下直接新建目录/添加 emoji 文件即可

### Demo

3123**[:1.小黄脸/呲牙.png:]**
:1.小黄脸/呲牙.png::1.小黄脸/呲牙.png:
test:2.原神/芙宁娜-乐.png:)

```markdown
3123**[:1.小黄脸/呲牙.png:]**
:1.小黄脸/呲牙.png::1.小黄脸/呲牙.png:
test:2.原神/芙宁娜-乐.png:)

```

## Frontmatter Config {#frontmatter}

### footer {#fm-footer}

- 类型：Boolean
- 默认：true

是否显示页面的页脚

```yml
---
footer: false #隐藏该页面的页脚
---
```

### aside {#fm-aside}

- 类型：Boolean
- 默认：true

是否显示页面的侧边栏

> 仅会在 `layout: doc` 时自动启用

```yml
---
footer: false #隐藏该页面的侧比栏
---
```

### wip {#fm-wip}

- 类型：Boolean
- 默认：false

配置页面顶部显示“施工中”的横幅，会覆盖 `banner` 配置

```yml
---
wip: true #显示施工中横幅
---
```

### banner {#fm-banner}

- 类型：String

配置页面的顶部的横幅内容，支持输入 HTML 不支持 Markdown。默认隐藏

```yml
---
banner: 我是Banner
---
```

### bannerExpiryDate {#fm-banner-expiry-date}

- 类型：Date

配置页面顶部的横幅关闭日期，默认无

```yml
---
banner: 服务器维护公告
bannerExpiryDate: 2024-2-1
---
```

### docHeader {#fm-doc-header}

- 类型：Boolean
- 默认：true

是否使用 docHeader 展示标题

> 仅会在 `layout: doc` 时自动启用

```yml
---
docHeader: false #隐藏该页面的 docHeader
---
```
