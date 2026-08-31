# 启动一门新语言翻译教程

为 [kongying-tavern/docs](https://github.com/kongying-tavern/docs) 启动一门新语言翻译的完整流程。

## 前置要求

- 该语言为原神官方所支持的语言
- 计划翻译超过 50% 的内容，包括 `index.md`、`download-client.md`、`community.md`、`support-us.md`、`translations.md` 等重点页面及 `.vitepress/locales/zh/` 站点配置
- 已在 [issue #242「文档社区翻译需求」](https://github.com/kongying-tavern/docs/issues/242) 下回复认领（**15 日内提交首个 PR**，逾期视为放弃）
- 不熟悉环境搭建？先看[翻译教程（无经验）](./trans-guide-no-exp.md)

## 第一步：初始化

```bash
pnpm install && pnpm init:locale
```

脚本交互询问语言代码（[ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)）、本地名称、BCP-47 标签与模板语言（`zh`/`en`，默认 `zh`；也可用 `--code`/`--label`/`--lang`/`--template` 参数直接提供），基于模板语言自动完成目录复制、占位符替换、注册翻译进度与语言切换条。新语言立即可被站点识别——**无需手动编辑任何注册文件**（语言列表、主题接线与 `hreflang` 均由目录约定自动生成）。

## 第二步：翻译

1. 页面正文：按 `src/zh` 结构翻译 `src/<代码>/**/*.md`，从重点页面开始；标题锚点 `{#...}` 保留原文；在 `translations.md` 的语言列表加上自己
2. 界面文案：翻译 `.vitepress/locales/<代码>/` 下的 TS 文件（`index.ts` 的标题与 `outlineTitle` 等、`constants.ts` 的 `META_*`、`nav`/`sidebar`/`footer`/`ui`/`forum` 等模块）及 `LanguageSuggestBar.ts` 中的新语言条目
3. 在 `issue #242` 认领文件，方便协作

> 文案字段由类型系统保证与默认语言结构一致（`pnpm typecheck` 会提示缺漏），放心改写。

## 第三步：验证与提交

```bash
pnpm typecheck && pnpm build   # 结构与构建校验
pnpm dev                       # 预览 /docs/<代码>/
```

以 Pull Request 提交翻译内容即可（不必按文件拆分），合并进度实时反映在[翻译进度页面](https://yuanshen.site/docs/_translations/)。全部完成后告知维护者即可在 [yuanshen.site](https://yuanshen.site) 上线。

## 参考

- [翻译教程（无经验）](./trans-guide-no-exp.md) —— 环境搭建与 Git 入门
- [Translation Guidelines](./translation-guide.md) —— 翻译规范（术语、锚点、PR 流程）
- [多语言及翻译页面](https://yuanshen.site/docs/translations/) —— 站点语言列表与归档说明
- [issue #242「文档社区翻译需求」](https://github.com/kongying-tavern/docs/issues/242) —— 认领与文件清单
