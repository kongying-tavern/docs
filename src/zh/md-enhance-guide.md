---
title: Markdown 增强语法指南
layout: doc
aside: true
outline: [2, 3]
search: false
next:
  text: "Frontmatter"
  link: "/frontmatter"
head:
  - - meta
    - name: robots
      content: noindex, nofollow
---

<!-- 该页面无需翻译 -->

本项目文档页面使用 Markdown 语法进行编写，除了 Vitepress 支持的 Markdown 基础组件之外，我们额外添加和实现了一些特有语法和组件。

## 组件语法 {#section-components}

我们扩展了代码块语法，用于显示一些特有组件。

### Timeline 时间线 {#timeline}

#### 语法

```markdown
::: timeline <标题>
<内容>
:::
```

> 该语法生成一条时间线条目。连续使用多次时间线条目时，连续的时间线条目会连成时间线。

#### 示例

:::: demo
::: timeline 2023-05-24

- **do some thing1**
- do some thing2

:::

::: timeline 2023-05-23

- do some thing3
- do some thing4

:::
::::

### Card 卡片 {#card}

#### 语法

MDC 形式（YAML props 使用 `---` 包裹）：

````markdown
::Card
---
<属性名1>: <属性值1>
<属性名2>: <属性值2>
...
---

::
````

> YAML props 也支持用 ` ```yaml [props] ` 包裹，效果与 `---` 相同。

代码块形式：

````markdown
```card
<属性名1>: <属性值1>
<属性名2>: <属性值2>
...
```
````

#### 卡片属性

| 属性名      | 描述                                                    | 默认值 |       类型        |
| ----------- | :------------------------------------------------------ | :----: | :---------------: |
| title       | 卡片标题，必填项                                        |   -    |     `String`      |
| desc        | 卡片描述，为空时默认显示为 link                         |  link  |     `String`      |
| link        | 卡片跳转链接，非必填                                    |   -    |     `String`      |
| logo        | 卡片下方 Logo 的链接，非必填。填 `self` 默认为空荧 Logo |   -    |     `String`      |
| theme       | 卡片主题，非必填                                        | normal | `normal`or`media` |
| color       | 卡片链颜色，非必填                                      | normal |     `String`      |
| cover       | 卡片封面链接，非必填。仅在normal主题生效                |   -    |     `String`      |
| hoverShadow | 是否启用卡片 hover 时阴影效果，默认不启用               | false  |     `Boolean`     |
| shadow      | 是否启用卡片阴影效果，默认不启用                        | false  |     `Boolean`     |

> B 站，百度，QQ，米游社，Youtube，X，Reddit，反馈平台的链接可以自动识别，无需手动填写 logo

#### 示例

> 基础主题

:::: demo

::Card
---
logo: self
title: That normal theme card
desc: This is description
cover: https://upload-bbs.miyoushe.com/upload/2024/02/21/292762008/86d3c06e1a1adf7ef432cf838f7abb8c_7693471731342377565.png?x-oss-process=image/resize,s_500/quality,q_80/auto-orient,0/interlace/1,format/jpg
---

::
::::

:::: demo

::Card
---
logo: self
title: That normal theme card
desc: No cover
hoverShadow: true
---

::
::::

> 兼容旧语法示例

:::: demo

```card
logo: self
title: Legacy card syntax
desc: This demo keeps the old fenced syntax
```

::::

> 中等主题

:::: demo

::Card
---
title: 观看客户端基础使用教程
link: https://www.bilibili.com/video/BV1uU4y157Te
theme: medium
shadow: true
---

::
::::

:::: demo

::Card
---
title: 网页版地图
link: https://yuanshen.site/
logo: self
desc: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
theme: medium
---

::
::::

## Markdown 语法扩展 {#section-markdown-syntax}

此外，我们还扩展了部分 Markdown 语法，用于实现一些显示或逻辑效果。

### Kbd 快捷键 {#kbd}

#### 语法

```markdown
[[<快捷键>]]
```

#### 示例

:::: demo
[[Meta]][[K]]
::::

### Footnote 脚注 {#footnote}

脚注用于在页面底部添加额外的注解说明。

#### 语法

在 Markdown 中使用以下语法定义脚注。

```markdown
[^<脚注锚点名>]
```

在后续任意位置，使用以下语法对脚注进行描述。

```markdown
[^<脚注锚点名>]: <脚注说明>
```

> 如果脚注包含多个段落，其后的段落应当添加缩进。

#### 示例

> 由于脚注会生成在页面底部，因此生成的示例脚注位于当前文档最底部。

:::: demo
脚注 1 链接 [^first]。

脚注 2 链接 [^second]。

行内的脚注^[行内脚注文本] 定义。

重复的页脚定义 [^second]。

[^first]: 脚注**可以包含特殊标记**

    也可以由多个段落组成

[^second]: 脚注文字。

::::

### Mark 标记 {#mark}

#### 语法

```markdown
==<标记文本>==
```

> 请注意，`==`外侧需要添加空格（详见示例）。

#### 示例

:::: demo
对于习惯了传统吟游诗人的蒙德来说， ==“偶像”== 是还不习惯的新生事物。但在蒙德，人人都爱芭芭拉。
::::

### 变量声明 {#variable}

变量声明可将 Markdown 声明为局部变量，并在后续 Markdown 中嵌入使用。

#### 语法

在 Markdown 中使用以下语法定义变量。此语法仅声明变量，但不会渲染任何内容。

```markdown
{define:<变量名>}<被声明的内容>{/define}
```

::: warning 提示
在上述语法中，

- 变量名前后可加空格。
- 变量名仅可包含字母数字与下划线。
  :::

声明变量后，可使用以下语法调用变量。

```markdown
{%=<变量名>%}
```

::: warning 提示
在上述语法中，变量名前后可加空格。
:::

#### 示例

:::: demo
{define:CONTENT}我是被定义的 **_变量_**{/define}
{%= CONTENT %}
::::

### Spoiler 文本遮罩 {#spolier}

#### 语法

```markdown
!!<被隐藏的内容>!!
```

#### 示例

:::: demo
输入!!xxx!!显示彩蛋

测试自适应宽度：!!短文本!! !!这是一段较长的隐藏内容!!

测试自定义宽度：!!自定义宽度!!{width=200} !!更长的内容!!{w=300}

测试文字对齐：!!居中对齐!!{align=center} !!右对齐!!{a=right}

测试组合属性：!!宽度和对齐!!{width=250,align=center}
::::

### Custom Color 文字颜色 {#custom-color}

#### 语法

```markdown
{color:<文字颜色>}<文字内容>{/color}
```

::: warning 提示

- 文字颜色可为 CSS 支持的颜色表示方式。
- 文字颜色前后可添加空格。
  :::

#### 示例

:::: demo
{color:#FF5733}红橙色文字{/color} 普通文字 {color:#33FF57}绿色文字{/color}

{color:red}红色文字{/color}

{color: var(--vp-c-purple-3)}_使用CSS Var的紫色文字_{/color}

{color: rgba(44,195,184,1)}**使用RGBA的青色文字**{/color}
::::

### Attrs 自定义属性 {#attrs}

#### 语法

自定义属性由 `markdown-it-attrs` 插件实现，具体语法请参见 [markdown-it-attrs 文档](https://www.npmjs.com/package/markdown-it-attrs)。

#### 示例

:::: demo
paragraph _style me_{.vp-link} more text
::::

### Mention 提及

提及功能可将 `@xxx` 类型的标记，转换为 Gitee 链接。

#### 语法

```markdown
@<被提及的人或者团队>
```

::: warning 说明
“被提及的人或团队”会根据 `src/_data` 目录下团队成员的 Gitee 账号数据，通过 `username` 或 `login` 字段转换成 Gitee 地址链接。
:::

#### 示例

:::: demo
@kongying-demo
::::

### Custom Emoji 自定义绘表情

#### 语法

```markdown
:<预设名>/<预设文件名>.<文件扩展名>:
```

::: warning 说明

- “预设名”对应 `src/public/emojis` 目录下的子目录名。
- “预设文件名”与预设文件夹中的文件一一对应。
- 若需要添加预设或预设文件，只需在 `src/public/emojis` 目录下添加目录或文件即可。
- 由于此语法与 GitHub 格式的 Markdown (GFM) emoji 语法一致，当预设文件不存在时，会回退为 GFM 语法的 emoji 表示。
  :::

#### 示例

:::: demo
大家好~**[:1.小黄脸/呲牙.png:]**
:1.小黄脸/呲牙.png::1.小黄脸/呲牙.png:
演出，开始~:2.原神/芙宁娜-乐.png:)
::::

### [Task list](https://mdit-plugins.github.io/zh/tasklist.html#%E9%80%89%E9%A1%B9)

#### 语法

使用 - [ ] 一些文字 渲染一个未勾选的任务项
使用 - [x] 一些文字 渲染一个勾选了的任务项 (我们也支持大写的 X)

#### 示例

:::: demo

- [ ] 计划 A
- [x] 计划 B

::::

### Ruby

#### 语法

```markdown
\*{ruby base:ruby text1|ruby text2|...}
```

#### 示例

:::: demo
\*{中国:zhōng|guó}
::::

### [Abbr](https://mdit-plugins.github.io/zh/abbr.html)

#### 语法

通过此插件，你可以通过以额外 \* 开头的链接声明来声明缩略词。

```markdown
\*[缩略词]: 内容
```

#### 示例

:::: demo
*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium

The HTML specificationis maintained by the W3C.
::::

### MDC

#### Inline Component Demo

:::: demo
:scratch-to-reveal[刮开这里查看隐藏内容]{width=300 .mt-4}
::::

#### Block Component Demo

:::: demo
::link-grid{.mt-4}
---
items:
  - icon: i-custom-bilibili
    name: Bilibili
    link: https://bilibili.com
    secondary: 小电视
  - icon: i-custom-gitee
    name: Gitee
    link: https://gitee.com
    secondary: 码云
---

::
::::

#### Slot Demo

:::: demo
::accordion-panels
---
type: multiple
defaultValue:
  - overview
  - details
items:
  - value: overview
    title: 默认 Slot：Markdown 内容
    slot: default
  - value: details
    title: 命名 Slot：Markdown 内容
---

#default
这里是默认 slot 的内容。

- 支持无序列表
- 支持 **粗体** 和 `inline code`
- 支持 [普通链接](https://gitee.com)

#details
这里是命名 slot 的内容。

> 这个区块来自 `#details`。

1. 支持有序列表
2. 支持 ==高亮==

::
::::

> 命名 slot 默认取 `items[].value`，也可以通过 `slot` 字段显式指定。
> `#slot-name` 与其内容需要和 `::accordion-panels` 保持同级缩进；YAML props（`---` 块）必须紧跟在组件起始行之后。

#### Props 语法

行内组件的 props 需要写在同一个 `{...}` 中，不支持连续声明多个 props block。

| 语法            | 含义                  | 示例          |
| --------------- | --------------------- | ------------- |
| `{key="value"}` | 字符串 prop（引号）   | `{.text-red}` |
| `{key=value}`   | 字符串 prop（无引号） | `{name=foo}`  |
| `{.class-name}` | class 简写            | `{.vp-link}`  |
| `{#id-name}`    | id 简写               | `{#main}`     |
| `{flag}`        | 布尔 prop（仅键名）   | `{disabled}`  |
