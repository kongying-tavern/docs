---
title: Markdown 增强语法指南
layout: doc
aside: true
outline: [2, 3]
search: false

next:
  text: Frontmatter
  link: /frontmatter

head:
  - - meta
    - name: robots
      content: "noindex, nofollow"
---

<!-- 该页面无需翻译 -->

本项目文档页面使用 Markdown 语法进行编写，除了 Vitepress 支持的 Markdown 基础组件之外，我们额外添加和实现了一些特有语法和组件。

## 组件语法 {#section-components}

我们扩展了代码块语法，用于显示一些特有组件。

### Timeline 时间线 {#timeline}

#### 语法

```markdown
::: timeline <日期|[标题]>[dot class]
<内容>
:::
```

> 该语法生成一条时间线条目。连续使用多次时间线条目时，连续的时间线条目会连成时间线。
>
> - **日期与标题**：用 `|` 分割——`|` 前的内容显示在圆点左侧(通常为日期)，`|` 后为圆点右侧标题。不写 `|` 时兼容旧写法：标题中的 `YYYY-MM-DD` 日期会自动提取到圆点左侧。
> - **dot 配置**：末尾 `[...]` 内为圆点配置项，逗号分隔：`border-*` 颜色类改圆点颜色(如 `border-red-500`)、`i-*` 图标类在圆点中心显示图标(如 `i-lucide-flag`)。
> - 注：配置用方括号而非大括号，因为站点的 Markdown 增强语法(MDC/attrs)会消耗大括号内容。

#### 示例

:::: demo
::: timeline 2023-05-24

- **do some thing1**
- do some thing2

:::

::: timeline 2023-05-23|[border-red-500]

- do some thing3
- do some thing4

:::

::: timeline 2023-05-22|[i-lucide-flag]

- do some thing5

:::
::::

### Card 卡片 {#card}

#### 语法

MDC 形式，属性写法见 [MDC 的 YAML 属性块](#mdc-props-yaml)：

```markdown
::Card
---
<属性名1>: <属性值1>
<属性名2>: <属性值2>
...
---
::
```

#### 卡片属性

| 属性名      | 描述                                                    | 默认值 |       类型        |
| ----------- | :------------------------------------------------------ | :----: | :---------------: |
| title       | 卡片标题，必填项                                        |   -    |     `String`      |
| desc        | 卡片描述，为空时默认显示为 link                         |  link  |     `String`      |
| link        | 卡片跳转链接，非必填                                    |   -    |     `String`      |
| logo        | 卡片下方 Logo 的链接，非必填。填 `self` 默认为空荧 Logo |   -    |     `String`      |
| theme       | 卡片主题，非必填                                        | normal | `normal` or `media` |
| color       | 卡片链颜色，非必填                                      | normal |     `String`      |
| cover       | 卡片封面链接，非必填。仅在 normal 主题生效                |   -    |     `String`      |
| hoverShadow | 是否启用卡片 hover 时阴影效果，默认不启用               | false  |     `Boolean`     |
| shadow      | 是否启用卡片阴影效果，默认不启用                        | false  |     `Boolean`     |

::: warning 说明
以下渠道的 logo 可通过链接自动识别，无需手动填写：

<span class="i-custom-bilibili inline-block align-middle"></span> [B 站](https://www.bilibili.com/)
<span class="inline-block w-3"></span> <span class="i-custom-baidu inline-block align-middle"></span> [百度](https://www.baidu.com/)
<span class="inline-block w-3"></span> <span class="i-custom-qq inline-block align-middle"></span> [QQ](https://www.qq.com/)
<span class="inline-block w-3"></span> <span class="i-logos-youtube-icon inline-block align-middle"></span> [YouTube](https://www.youtube.com/)
<span class="inline-block w-3"></span> <span class="i-logos-twitter inline-block align-middle"></span> [X](https://x.com/)
<span class="inline-block w-3"></span> <span class="i-logos-discord-icon inline-block align-middle"></span> [Discord](https://discord.com/)
<span class="inline-block w-3"></span> <span class="i-logos-reddit-icon inline-block align-middle"></span> [Reddit](https://www.reddit.com/)
<span class="inline-block w-3"></span> <span class="i-custom-txc inline-block align-middle"></span> [兔小巢](https://txc.qq.com/)
<span class="inline-block w-3"></span> <span class="i-custom-wxtl inline-block align-middle"></span> [维系天理](https://www.weixitianli.com/)

:::

#### 示例

> 基础主题

::: demo
::Card
---
logo: self
title: That normal theme card
desc: This is description
cover: https://upload-bbs.miyoushe.com/upload/2024/02/21/292762008/86d3c06e1a1adf7ef432cf838f7abb8c_7693471731342377565.png
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

用 `[[按键]]` 展示快捷键：`+` 表示同时按下，`,` 表示依次按下。

#### 示例

<!-- zhlint ignore: [[Ctrl+K, Ctrl+Alt+C]] -->
<!-- zhlint ignore: [[G, I]] -->

:::: demo

| 用法 | 示例 |
| --- | --- |
| 单键 | [[Esc]] [[Enter]] [[F1]] |
| 组合键 | [[Ctrl+Shift+P]] |
| 连续组合键 | [[Ctrl+K, Ctrl+Alt+C]] |
| 按键序列 | [[G, I]] |
| 任选其一 | [[F1]] 或 [[Ctrl+H]] |
| 方向键 | [[Up]] [[Down]] [[Left]] [[Right]] |
| 系统键 | [[Win]] [[Meta]] |
| 符号键 | [[Ctrl+Plus]] [[Mod+Comma]] |

::::

按键名不区分大小写。方向键也支持 `ArrowUp`、`ArrUp` 等别名；加号键和逗号键分别写作 `Plus`、`Comma`。

#### 平台适配

`Mod` 自动适配主修饰键：Apple 平台为 ⌘，Windows / Linux 为 Ctrl。明确写出的 `Ctrl`、`Cmd` 保持各自含义。

编写指定平台的教程时，用 `platform` 固定显示，可选 `mac`、`windows`、`linux`：

:::: demo
自动适配：[[Mod+K]]。

Windows：[[Mod+K]]{platform=windows}；macOS：[[Mod+K]]{platform=mac}。
::::

::: details 在 Vue 中使用
`sequence` 的每个内层数组表示同时按下，多个数组表示依次按下：

```vue
<KeyboardShortcut
  :sequence="[['Ctrl', 'A'], ['Ctrl', 'D']]"
  platform="windows"
/>
```

:::

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

> 请注意，`==` 外侧需要添加空格(详见示例)。

#### 示例

:::: demo
对于习惯了传统吟游诗人的蒙德来说， ==「偶像」== 是还不习惯的新生事物。但在蒙德，人人都爱芭芭拉。
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
{define:CONTENT}我是被定义的**_变量_**{/define}
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

{color: var(--vp-c-purple-3)}_使用 CSS Var 的紫色文字_{/color}

{color: rgba(44,195,184,1)}**使用 RGBA 的青色文字**{/color}
::::

### Attrs 自定义属性 {#attrs}

#### 语法

自定义属性由 VitePress 内置的 `@mdit/plugin-attrs` 实现，具体语法请参见 [Attrs 文档](https://mdit-plugins.github.io/attrs.html)。

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
「被提及的人或团队」会根据 `data/static/common` 目录下团队成员的 Gitee 账号数据，通过 `username` 或 `login` 字段转换成 Gitee 地址链接。
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

- 「预设名」对应 `pages/public/emojis` 目录下的子目录名。
- 「预设文件名」与预设文件夹中的文件一一对应。
- 若需要添加预设或预设文件，只需在 `pages/public/emojis` 目录下添加目录或文件即可。
- 由于此语法与 GitHub 格式的 Markdown (GFM) emoji 语法一致，当预设文件不存在时，会回退为 GFM 语法的 emoji 表示。
:::

#### 示例

:::: demo
<!-- zhlint ignore: :1.小黄脸/呲牙.png: -->
<!-- zhlint ignore: :2.原神/芙宁娜-乐.png: -->

大家好~**:1.小黄脸/呲牙.png:**
:1.小黄脸/呲牙.png:
演出，开始~:2.原神/芙宁娜-乐.png:
::::

### [Task List 任务列表](https://mdit-plugins.github.io/zh/tasklist.html#%E9%80%89%E9%A1%B9) {#task-list}

#### 语法

- 使用 `- [ ] 一些文字` 渲染一个未勾选的任务项，方括号内需要保留一个空格。
- 使用 `- [x] 一些文字` 渲染一个已勾选的任务项，也支持大写的 `X`。

#### 示例

:::: demo

- [ ] 计划 A
- [x] 计划 B

::::

### Ruby

#### 语法

```markdown
*{ruby base:ruby text1|ruby text2|...}
```

#### 示例

:::: demo
*{中国:zhōng|guó}
::::

### [Abbr 缩略词](https://mdit-plugins.github.io/zh/abbr.html) {#abbr}

#### 语法

使用以 `*` 开头的链接声明格式定义缩略词：

```markdown
*[缩略词]: 内容
```

#### 示例

:::: demo
*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium

The HTML specificationis maintained by the W3C.
::::

## MDC {#mdc}

MDC 是一套兼容 Markdown 的 Vue 组件书写语法。组件名注意大小写，请按各组件的文档写法书写。

### 行内组件 {#mdc-inline}

行内组件嵌在正文里，写法是 `:组件名[内容]`。方括号内的内容会按 Markdown 渲染，可以继续使用加粗、行内代码等标记。

:::: demo
:Spoiler[刮开这里查看隐藏内容]
::::

### 块组件 {#mdc-block}

块组件独占段落，写法是 `::组件名` 开始、单独一行 `::` 结束。两行之间的内容会按 Markdown 渲染，可以写多段、列表等。

:::: demo
::Spoiler
刮开这里查看隐藏内容
::
::::

### 属性 {#mdc-props}

#### 花括号属性 {#mdc-props-brace}

花括号属性用于给组件传属性。行内组件和块组件的写法不同：行内组件写在 `[内容]` 后，块组件写在起始行，下面分别列出。

行内组件：

| 语法            | 说明                             | 示例                       |
| --------------- | -------------------------------- | -------------------------- |
| `{key=value}`   | 传入字符串属性                   | `{name=foo}`               |
| `{key="value"}` | 传入字符串，避免歧义时用引号     | `{name="foo bar"}`         |
| `{.class-name}` | 添加 class，可写多个             | `{.vp-link}`               |
| `{#id-name}`    | 设置元素 ID                      | `{#main}`                  |
| `{flag}`        | 作为静态属性传入字符串 `true`    | `{disabled}`               |
| `{:key=value}`  | Vue 绑定，值按表达式解析         | `{:width=300}`             |
| `{:key='expr'}` | Vue 绑定，值含引号时用单引号包裹 | `{:data='{"key": "val"}'}` |
| `{:key}`        | Vue 绑定布尔值 `true`            | `{:disabled}`              |

块组件：

| 语法            | 说明                                                   | 示例                        |
| --------------- | ------------------------------------------------------ | --------------------------- |
| `{key=value}`   | 字符串按普通属性传入；数字、布尔、数组、对象按表达式解析 | `{name=foo}`、`{width=300}` |
| `{key="value"}` | 传入字符串，避免歧义时用引号                           | `{name="foo bar"}`          |
| `{.class-name}` | 添加 class，可写多个                                   | `{.vp-link}`                |
| `{#id-name}`    | 设置元素 ID                                            | `{#main}`                   |
| `{flag}`        | 传入布尔值 `true`                                      | `{disabled}`                |

多个属性写在同一个 `{...}` 中，用空格分隔，例如 `{:width=300 .text-red}`。

#### YAML 属性块 {#mdc-props-yaml}

YAML 属性块只用于块组件，以独立一行 `---` 开始和结束：

```markdown
::Card
---
title: 卡片标题
count: 3
hoverShadow: true
items:
  - name: A
    link: https://a.com
---
::
```

也可用 `yaml` 代码块包裹，`[props]` 标记不可省略：

````markdown
::Card
```yaml [props]
title: 卡片标题
count: 3
hoverShadow: true
items:
  - name: A
    link: https://a.com
```
::
````

### 插槽 {#mdc-slots}

插槽用于向组件传入 Markdown 内容。

- 用独立一行的 `#名称` 定义插槽，`#` 后不留空格；其后的内容直到下一个插槽标记或组件结束标记都属于该插槽。
- 未标记的内容进入默认插槽，默认插槽名是 `default`；也可以显式写 `#default`。

:::: demo
::accordion-panels
---
items:
  - value: overview
    title: 默认插槽
    slot: default
  - value: details
    title: 命名插槽
---

#default
这是**默认插槽**的内容，会显示在第一个面板里。

#details
这是 `#details` 插槽的内容，会显示在第二个面板里。
::
::::

### 组合规则 {#mdc-composition}

组合时按以下规则书写：

- **内容**：
  - 行内组件可以放在段落、列表、表格等 Markdown 内容中。
  - 块组件内部可以继续写行内组件、块组件和多段 Markdown。
- **花括号属性**：
  - 行内组件写在 `[内容]` 后，例如 `:Spoiler[文本]{width=300}`。
  - 块组件写在起始行，例如 `::Card{.mt-4}`。
  - 花括号属性与 Attrs 写法相似，但用途不同：前者是 MDC 的组件属性语法，后者用于给 Markdown 元素添加属性。
- **数量限制**：一个组件最多写一组花括号属性和一块 YAML 属性块。
- 花括号属性和 YAML 属性块可同时使用；同名属性以 YAML 属性块的值为准。

### 示例 {#mdc-example}

:::: demo
:Spoiler[默认刮刮卡]

:Spoiler[自定义宽度]{:width=200}
::::

:::: demo
::Card{.mt-4 title=花括号标题}
---
title: YAML 标题
desc: 描述文字
theme: medium
---
::
::::
