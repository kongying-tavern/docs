# 翻译指南

用这份指南翻译文档站点。地图客户端的翻译见[翻译页面](https://yuanshen.site/docs/translations/#translations-client)。

本地准备：[翻译入门](./trans-guide-no-exp-zh.md) · [Getting started](./trans-guide-no-exp-en.md)。新增语言：[新增语言指南](./trans-guide-new-language-zh.md) · [Adding a language](./trans-guide-new-language-en.md)。英文版见 [Translation Guide](./translation-guide-en.md)。

## 翻译与本地化

翻译把内容从中文转成另一种语言，保留原文的结构和含义。本地化让译文读起来像母语者写的，用词、句式、举例符合目标语言的习惯。这份指南以翻译为主。直译会让目标读者看不懂时，用目标语言里对应的说法，这一步属于本地化。

## 文件与工具

| 内容 | 文件 | 编辑方式 |
| --- | --- | --- |
| 文章 | `pages/<语言>/**/*.md` | Markdown 编辑器 |
| 界面词条 | `.vitepress/locales/<语言>/*.yml`，`site.yml` 除外 | `pnpm i18n:ui` |
| 站点配置 | `.vitepress/locales/<语言>/site.yml` | `pnpm i18n:ui` 或 YAML 编辑器 |

### 进度看板

两个已发布的看板显示待翻译内容：[Lunaria](https://yuanshen.site/docs/_translations/) 跟踪文章，[x18n](https://yuanshen.site/docs/_i18n/) 跟踪界面与站点文案。看板只读，反映已经合并和部署的结果，不是编辑入口。在上面的文件里改动，再通过 Pull Request 提交。

### 认领文章

翻译文章前先到[认领看板](https://github.com/kongying-tavern/docs/issues/555)认领。看板列出可认领的文章、认领命令和期限。界面词条不通过看板认领，直接编辑 YAML 并提交 Pull Request。共享配置与生成文件不要改。

### 源文与译文

翻译时只改目标语言的文件，不要改 `pages/zh/` 的中文源文。改动源文会让所有语言的译文被标记为需要更新。

原文更新后，译文需要跟着修订。Lunaria 会把这类文章标为需要更新，和待翻译文章一起列在认领看板。认领方式相同，对照更新后的原文修改译文后提交 Pull Request。改动合并部署后，看板重新计算状态，文章不再列为需要更新。

## 作者备注

原始书写者可能在 Markdown 页面旁留下备注，向译者传递上下文，例如不同语言对应的 URL。这些备注由 VS Code 扩展 [Code Explainer Notes](https://marketplace.visualstudio.com/items?itemName=AristideKamara.code-explainer-notes)（`aristidekamara.code-explainer-notes`）存放在共享工作区文件 `.vscode/code-comments.json`。它们不属于页面正文。

所有贡献者都必须安装该扩展，因为只有安装后才能看到备注。扩展列在 `.vscode/extensions.json`，打开工作区时 VS Code 会提示安装。

- 作者：选中相关文本，运行 `Code Explainer: Add Comment`，用共享存储保存，备注会随仓库提交。源文本移动后要重新关联备注。
- 译者：翻译前查看 Code Explainer 侧栏或段落标记。备注是给你的说明，不是页面正文。把备注提供的具体值放到页面对应位置，例如把语言专属 URL 填进链接目标。不要把备注原话粘进 Markdown，否则会把译者说明混进译文。

## 翻译范围

先判断内容要不要翻译，再动手。

### 要翻译

- 文章正文
- 文本性 frontmatter：判断标准是这段文本的读者是站点访客，例如 `title`、`description` 和首页 `features` 中的文字
- MDC 容器和组件的显示文本：容器类型、组件名和参数名保持原样，参数值里给读者看的文字要翻译
- 界面词条里展示给用户的文案
- `site.yml` 里的展示文案，例如导航文字、按钮、提示、页脚
- 图片 alt：图片加载不出来时，读者靠它理解内容
- 链接与图片等资源地址：按目标语言填写，有作者注释时以注释为准

### 不用翻译的文件

- 工具文档：`frontmatter.md`、`md-enhance-guide.md`。
- 模板与静态资源：`blog/[path].md`、`pages/public/**`。

Lunaria 不追踪这些文件，文章进度看板不会列出它们。

### 保持原样

**Markdown 与 MDC 语法**

- 标题、列表、引用、代码围栏等语法符号。
- 容器标记、参数分隔、属性标记和显式标题锚点。组件名、参数名不翻译，给用户看的文字要翻译。
- 卡片、时间线、自定义绘表情等站点特有语法见 [Markdown 增强语法指南](https://yuanshen.site/docs/md-enhance-guide)。

**程序标识**

- YAML 键名，也就是冒号左边的部分。
- 控制布局或行为的 frontmatter 字段及其值，例如 `layout`、`aside`、`search`。
- vue-i18n 的 `{name}` 占位符、`|` 复数分隔符、组件插槽名。

**匹配规则**

- `site.yml` 和共享配置里的正则规则、标题匹配字符串。

**代码**

- 代码块和行内代码里的命令、参数、路径、代码示例。

## 用词

- 用词以原神官方或空荧酒馆官方为准，不使用社区俚语和自造简称。
- 官方与行业通用的缩写照常保留。
- 游戏专名查项目提供的术语对照资源，产品功能名查界面词条和[论坛术语表](./forum-glossary.md)。
- 同一概念在不同位置用词一致。

## 特殊情形

- 某语言缺少页面时，链接到已有译文并标注语言。
- 论坛文案遵循[论坛术语表](./forum-glossary.md)。检查短标签、插值内容和链接。
- 对照原文逐条检查警告块及其在页面中的用法。

## 检查与提交

按改动类型运行对应检查，命令与改动类型的对应关系见[开发指南](../contributing/development-guide.md#检查范围)。界面词条或站点配置改动还要运行 `pnpm build`。

Pull Request 中写明语言、改动内容和已运行的检查。只提交源文件，排除 `dist/` 和生成的字体。

命令行为、文件写入和 Vue 用法见 [i18n 开发说明](../../../scripts/x18n/README.md#命令说明)。
