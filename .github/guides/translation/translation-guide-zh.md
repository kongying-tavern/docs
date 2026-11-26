# 翻译指南

用这份指南翻译文档站点。地图客户端的翻译见[翻译页面](https://yuanshen.site/docs/translations/#translations-client)。

本地准备：[翻译入门](./trans-guide-no-exp-zh.md) · [Getting started](./trans-guide-no-exp-en.md)。新增语言：[新增语言指南](./trans-guide-new-language-zh.md) · [Adding a language](./trans-guide-new-language-en.md)。英文版见 [Translation Guide](./translation-guide-en.md)。

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

## 作者备注

原始书写者可能在 Markdown 页面旁留下备注，向译者传递上下文，例如不同语言对应的 URL。这些备注由 VS Code 扩展 [Code Explainer Notes](https://marketplace.visualstudio.com/items?itemName=AristideKamara.code-explainer-notes)（`aristidekamara.code-explainer-notes`）存放在共享工作区文件 `.vscode/code-comments.json`。它们不属于页面正文。

所有贡献者都必须安装该扩展，因为只有安装后才能看到备注。扩展列在 `.vscode/extensions.json`，打开工作区时 VS Code 会提示安装。

- 作者：选中相关文本，运行 `Code Explainer: Add Comment`，用共享存储保存，备注会随仓库提交。源文本移动后要重新关联备注。
- 译者：翻译前查看 Code Explainer 侧栏或段落标记。备注是给你的说明，不是页面正文。把备注提供的具体值放到页面对应位置，例如把语言专属 URL 填进链接目标。不要把备注原话粘进 Markdown，否则会把译者说明混进译文。

## 翻译规则

- 从中文原文翻译，保留页面结构。翻译 frontmatter 的 title 和 description。保留 `{#installation}` 这类显式标题锚点和组件名。
- 卡片、时间线、自定义绘表情等站点特有语法见 [Markdown 增强语法指南](https://yuanshen.site/docs/md-enhance-guide)。
- 保留 YAML 键、`{name}` 占位符、组件插槽名和复数分隔符 `|`。x18n 还列出 `site.yml` 中的链接和正则规则。只有任务要求时才改它们。
- 各语言的菜单分组与顺序保持一致，数组条目按下标匹配。某语言缺少页面时，链接到已有译文并标注语言。
- 论坛文案遵循[论坛术语表](./forum-glossary.md)。检查短标签、插值内容和链接。
- 对照原文逐条检查警告块及其在页面中的用法。原文变化时同步更新译文。

## 检查与提交

按改动类型运行对应检查，命令与改动类型的对应关系见[开发指南](../contributing/development-guide.md#检查范围)。界面词条或站点配置改动还要运行 `pnpm build`。

Pull Request 中写明语言、改动内容和已运行的检查。只提交源文件，排除 `dist/` 和生成的字体。

命令行为、文件写入和 Vue 用法见 [i18n 开发说明](../../../scripts/x18n/README.md#命令说明)。
