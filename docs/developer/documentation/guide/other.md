---
title: Other in Markdown
prev:
  text: Presentation
  link: ./presentation.md
next:
  text: Mermaid
  link: ./mermaid.md
---

## Superscript and Subscript

### 语法

使用 ^ ^ 进行上角标标注。

使用 ~ ~ 进行下角标标注。

### 演示

`输入`

```md
- 19^th^
- H~2~O
```

`输出`

- 19^th^
- H~2~O

## Custom alignment

### 语法

```md
::: center
Paragraph to center
:::

::: right
Right paragraph
:::
```

### 演示

`输入`

```md
::: center
Paragraph to center
:::

::: right
Right paragraph
:::
```

`输出`

::: center
Paragraph to center
:::

::: right
Right paragraph
:::

## Custom Containers

### 语法

```md
::: <type> [title]
[content]
:::
```

type 是必需的， title 和 content 是可选的。

支持的 type 有：

- tip
- warning
- danger
- details
- CodeGroup 和 CodeGroupItem 的别名：
- code-group
- code-group-item

### 演示

`输入`

```md
::: tip
这是一个提示
:::

::: warning
这是一个警告
:::

::: danger
这是一个危险警告
:::

::: details
这是一个 details 标签，在 IE / Edge 中不生效
:::
```

`输出`

::: tip
这是一个提示
:::

::: warning
这是一个警告
:::

::: danger
这是一个危险警告
:::

::: details
这是一个 details 标签，在 IE / Edge 中不生效
:::

#### 自定义标题

`输入`

````md
::: danger STOP
危险区域，禁止通行
:::

::: details 点击查看代码

```js
console.log('自定义标题！')
```
````

::: danger STOP
危险区域，禁止通行
:::

::: details 点击查看代码

```js
console.log('自定义标题！')
```

:::

#### Code Group 别名

- 示例 3 （Code Group 别名）：

`输入`

````md
:::: code-group
::: code-group-item FOO

```js
const foo = 'foo'
```

:::
::: code-group-item BAR

```js
const bar = 'bar'
```

:::
::::
````

`输出`

:::: code-group
::: code-group-item FOO

```js
const foo = 'foo'
```

:::
::: code-group-item BAR

```js
const bar = 'bar'
```

:::
::::

## Footnote

### 语法

在 Markdown 中使用 [^锚点文字] 来定义脚注。

在之后的任何位置使用 [^锚点文字]: ... 来描述脚注内容。

如果脚注包含多个段落，其后的段落应当保持双层缩进。

### 演示

`输入`

```md
脚注 1 链接[^first].

脚注 2 链接[^second].

行内的脚注^[Text of inline footnote] 定义.

重复的页脚定义[^second].

[^first]: 脚注 **可以包含特殊标记**

也可以由多个段落组成

[^second]: 脚注文字。
```

`输出`

脚注 1 链接[^first].

脚注 2 链接[^second].

行内的脚注^[Text of inline footnote] 定义.

重复的页脚定义[^second].

[^first]: 脚注 **可以包含特殊标记**

    也可以由多个段落组成

[^second]: 脚注文字。

## Markup

### 语法

使用 == == 进行标记。请注意两边需要有空格。

### 演示

`输入`

```md
你好 ==我是一个 Makrup== 。
```

`输出`

你好 ==我是一个 Makrup== 。

## Task list

### 语法

使用 - [ ] 一些文字 渲染一个未勾选的任务项
使用 - [x] 一些文字 渲染一个勾选了的任务项同时支持大写的 X

### 演示

`输入`

```md
- [ ] Plan A
- [x] Plan B
```

`输出`

- [ ] Plan A
- [x] Plan B
