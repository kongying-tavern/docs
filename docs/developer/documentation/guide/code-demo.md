---
title: CodeDemo in Markdown
prev:
  text: Other
  link: ./other.md
next:
  text: Tex
  link: ./tex.md
---

## CodeDemo

如何在项目中的 Markdown 里使用 CodeDemo。

## 语法

````md
::: demo [类型] 可选的标题文字

```html
<!-- ↑ 使用可用的语言 -->
<!-- 放置你的代码 -->
<!-- 你可以有多个代码块 -->
```

```json
// json block 作为插件配置
{
  // 放置你的配置 (optional)
}
```

:::
````

::: tip

JSON 块是可选的。

:::

该插件支持三种类型：

- normal (默认)
- vue
- react

### Normal

````md
::: demo 可选的标题文字

```html
<!-- html code -->
```

```js
// js code
```

```css
/* css code */
```

```json
// 配置 (可选)
{
  "jsLib": [
    ...
  ],
  "cssLib":[
    ...
  ]
}
```

:::
````

### Vue

````md
::: demo [vue] 可选的标题文字

```vue
<!-- ↑ 你也可以使用 html -->
<template>
  <!-- vue 模板 -->
</template>
<script>
export default {
  // vue 组件
}
</script>
<style>
/* css 代码 */
</style>
```

```json
// 配置 (可选)
```

:::
````

### React

````md
::: demo [react] 可选的标题文字

```js
export default class App extends React.Component {
  // react 组件
}
```

```css
/* 你的 css 内容 */
```

```json
// 配置 (可选)
```

:::
````

### 支持的语言

- html (默认)
- slim
- haml
- makdown
- javascript (默认)
- coffeescript
- babel
- livescript
- typescript
- css (默认)
- less
- sc/ass
- stylus
