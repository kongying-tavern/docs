# 新增翻译语言

这份指南讲怎么为一个新语言建立完整的翻译目录。修改已有语言的译文，见[翻译入门](./trans-guide-no-exp-zh.md)。英文版见 [Adding a Translation Language](./trans-guide-new-language-en.md)。

## 开始前

新增语言意味着要承担整个站点的翻译，而不仅是几篇文章。先确认三件事：

- 新增语言须为原神官方支持的语言。
- 计划翻译超过一半的内容，包括首页、下载、社区、支持我们、翻译说明等重点页面，以及站点配置和界面词条。
- 先到[翻译认领看板](https://github.com/kongying-tavern/docs/issues/555)按说明认领文章，期限以看板为准。

## 初始化

### 生成初始文件

准备好[本地环境](../../../README.md#contributing)后运行：

```sh
pnpm init:locale
```

这个命令以现有语言为模板，生成新语言所需的文章和词条文件，并写入语言名称与标签。它不会覆盖已有内容：同名目录已存在时会报错。

### 按提示填写

命令会依次询问四项信息：

- **语言代码**：如 `en`，对应 `--code`
- **语言名称**：展示给读者的名称，对应 `--label`
- **语言标签**：BCP-47 格式，如 `en` 或 `en-US`；省略时使用语言代码，对应 `--lang`
- **模板**：复制 `zh` 或 `en` 的内容，默认 `zh`，对应 `--template`

这四项也可以直接用 `--code`、`--label`、`--lang`、`--template` 参数传入。

### 新语言如何被识别

VitePress 和翻译看板都会自动扫描 `.vitepress/locales`，不需要手动注册语言。生成的文件已经包含站点文案和界面词条，接下来只需把它们翻译成目标语言。

## 完成翻译

1. 对照 `pages/zh/` 翻译新语言文章，优先完成重点页面。
2. 翻译复制来的全部 YAML，包括 `site.yml` 中的站点文案和语言建议栏。`site.yml` 的改动会被 VitePress 重载。
3. 在各语言 `translations.md` 的语言列表中补上新入口。
4. 按[翻译范围](./translation-guide-zh.md#翻译范围)复核文案，完成[提交前检查](./translation-guide-zh.md#检查与提交)后提交 Pull Request。
