# 新增翻译语言

修改已有语言的翻译，见[翻译入门](./trans-guide-no-exp.md)。

## 开始前

- 新增语言须为原神官方支持的语言。
- 计划翻译超过一半的内容，包括首页、下载、社区、支持我们、翻译说明等重点页面，以及站点配置和界面词条。
- 先到[翻译认领看板](https://github.com/kongying-tavern/docs/issues/555)按说明认领文章，期限以看板为准。

## 初始化

准备好[本地环境](../README.md#contributing)后运行：

```sh
pnpm init:locale
```

按提示输入语言代码、该语言的名称、语言标签和模板。语言标签使用 BCP-47 格式，如 `en` 或 `en-US`；省略时使用语言代码。模板可选 `zh` 或 `en`，默认 `zh`。这些选项也可通过 `--code`、`--label`、`--lang`、`--template` 参数传入。

脚本会复制模板文章和词条，填写语言名称与标签，并完成站点和翻译看板的注册。已有同名目录或语言时会报错，不会覆盖。

## 完成翻译

1. 对照 `src/zh/` 翻译新语言文章，优先完成重点页面。
2. 翻译复制来的全部 YAML，包括 `site.yml` 中的站点文案和语言建议栏。`config.ts` 无需修改。
3. 在各语言 `translations.md` 的语言列表中补上新入口。
4. 按[翻译规则](./translation-guide.md#translation-rules)复核文案，完成[提交前检查](./translation-guide.md#checks-and-submission)后提交 Pull Request。
