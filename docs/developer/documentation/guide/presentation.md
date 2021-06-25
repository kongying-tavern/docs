---
title: Presentation in Markdown
prev:
  text: mermaid
  link: ./mermaid.md
next:
  text: Other
  link: ./Other.md
---

## Presentation in Markdown

如何在项目中的 Markdown 里使用 Presentation。

## 相关链接

- [依赖插件 reveal.js](https://revealjs.com/)

## 语法

使用 --- 分割幻灯片

使用 -- 对幻灯片进行二次分割(垂直显示)

```md
@slidestart [theme]

<!-- slide1 -->

---

<!-- slide2 -->

---

<!-- slide3 -->

@slideend
```

目前可用的主题(请使用它们直接替换 `[theme]`):

- `auto` (默认)
- `black`
- `white`
- `league`
- `beige`
- `sky`
- `night`
- `serif`
- `simple`
- `solarized`
- `blood`
- `moon`

## 演示

## `auto`

@slidestart

### 幻灯片标题

一个拥有文字和 [链接](https://yuanshen.site/docs/) 的段落

---

### 代码高亮

```js [2-4|1-5]
const add = (a, b) => {
  if (typeof b === "undefined") return a + 1;

  return a + b;
};
```

@slideend

## `black`

@slidestart black

### 幻灯片标题

一个拥有文字和 [链接](https://yuanshen.site/docs/) 的段落

---

### 代码高亮

```js [2-4|1-5]
const add = (a, b) => {
  if (typeof b === "undefined") return a + 1;

  return a + b;
};
```

@slideend

## `white`

@slidestart white

### 幻灯片标题

一个拥有文字和 [链接](https://yuanshen.site/docs/) 的段落

---

### 代码高亮

```js [2-4|1-5]
const add = (a, b) => {
  if (typeof b === "undefined") return a + 1;

  return a + b;
};
```

@slideend

## `league`

@slidestart league

### 幻灯片标题

一个拥有文字和 [链接](https://yuanshen.site/docs/) 的段落

---

### 代码高亮

```js [2-4|1-5]
const add = (a, b) => {
  if (typeof b === "undefined") return a + 1;

  return a + b;
};
```

@slideend

## `beige`

@slidestart beige

### 幻灯片标题

一个拥有文字和 [链接](https://yuanshen.site/docs/) 的段落

---

### 代码高亮

```js [2-4|1-5]
const add = (a, b) => {
  if (typeof b === "undefined") return a + 1;

  return a + b;
};
```

@slideend

## `sky`

@slidestart sky

### 幻灯片标题

一个拥有文字和 [链接](https://yuanshen.site/docs/) 的段落

---

### 代码高亮

```js [2-4|1-5]
const add = (a, b) => {
  if (typeof b === "undefined") return a + 1;

  return a + b;
};
```

@slideend

## `night`

@slidestart night

### 幻灯片标题

一个拥有文字和 [链接](https://yuanshen.site/docs/) 的段落

---

### 代码高亮

```js [2-4|1-5]
const add = (a, b) => {
  if (typeof b === "undefined") return a + 1;

  return a + b;
};
```

@slideend

## `serif`

@slidestart serif

### 幻灯片标题

一个拥有文字和 [链接](https://yuanshen.site/docs/) 的段落

---

### 代码高亮

```js [2-4|1-5]
const add = (a, b) => {
  if (typeof b === "undefined") return a + 1;

  return a + b;
};
```

@slideend

## `simple`

@slidestart simple

### 幻灯片标题

一个拥有文字和 [链接](https://yuanshen.site/docs/) 的段落

---

### 代码高亮

```js [2-4|1-5]
const add = (a, b) => {
  if (typeof b === "undefined") return a + 1;

  return a + b;
};
```

@slideend

## `solarized`

@slidestart solarized

### 幻灯片标题

一个拥有文字和 [链接](https://yuanshen.site/docs/) 的段落

---

### 代码高亮

```js [2-4|1-5]
const add = (a, b) => {
  if (typeof b === "undefined") return a + 1;

  return a + b;
};
```

@slideend

## `blood`

@slidestart blood

### 幻灯片标题

一个拥有文字和 [链接](https://yuanshen.site/docs/) 的段落

---

### 代码高亮

```js [2-4|1-5]
const add = (a, b) => {
  if (typeof b === "undefined") return a + 1;

  return a + b;
};
```

@slideend

## `moon`

@slidestart moon

### 幻灯片标题

一个拥有文字和 [链接](https://yuanshen.site/docs/) 的段落

---

### 代码高亮

```js [2-4|1-5]
const add = (a, b) => {
  if (typeof b === "undefined") return a + 1;

  return a + b;
};
```

## 其他

更多选项，请参见[reveal.js config](https://revealjs.com/config/)，更多用法，请参阅 [reveal.js 文档](https://revealjs.com/)。
