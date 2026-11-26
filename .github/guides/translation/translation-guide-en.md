# Translation Guide

Use this guide to translate the documentation site. For map client translations, see the [translations page](https://yuanshen.site/docs/translations/#translations-client).

Local setup: [中文教程](./trans-guide-no-exp-zh.md) · [English tutorial](./trans-guide-no-exp-en.md). To add a language, follow the [new language guide (Chinese)](./trans-guide-new-language-zh.md) or [Adding a language](./trans-guide-new-language-en.md). Chinese version: [翻译指南](./translation-guide-zh.md).

## Translation and localization

Translation converts content from Chinese into another language while keeping the original structure and meaning. Localization makes the result read as though a native speaker wrote it, with wording, sentence structure and examples that fit the target language. This guide focuses on translation. When a literal translation would confuse readers, use an equivalent expression in the target language. That step belongs to localization.

## Files and tools

| Content | Files | Editing |
| --- | --- | --- |
| Articles | `pages/<locale>/**/*.md` | Markdown editor |
| UI messages | `.vitepress/locales/<locale>/*.yml`, except `site.yml` | `pnpm i18n:ui` |
| Site configuration | `.vitepress/locales/<locale>/site.yml` | `pnpm i18n:ui` or YAML editor |

### Progress dashboards

Two published dashboards show what still needs translation: [Lunaria](https://yuanshen.site/docs/_translations/) tracks articles and [x18n](https://yuanshen.site/docs/_i18n/) tracks UI and site text. They are read-only — they reflect what has been merged and deployed, not a place to edit. Make changes in the files above and submit a pull request.

### Claiming work

Before translating an article, claim it on the [claim board](https://github.com/kongying-tavern/docs/issues/555). The board lists the available articles, the claim commands and the deadline. UI messages are not claimed through the board: edit the YAML files and submit a pull request. Leave shared configuration and generated files unchanged.

## Author notes

The original author may leave notes beside a Markdown page to pass context to translators, such as locale-specific URLs. These notes are stored by the VS Code extension [Code Explainer Notes](https://marketplace.visualstudio.com/items?itemName=AristideKamara.code-explainer-notes) (`aristidekamara.code-explainer-notes`) in the shared workspace file `.vscode/code-comments.json`. They are not part of the page source.

The extension is **required for all contributors**: notes are visible only through it, so every translator must install it to see the same guidance. It is listed in `.vscode/extensions.json`, and VS Code prompts you to install it when you open the workspace.

- Authors: select the relevant text and run `Code Explainer: Add Comment`, then save in shared storage mode so the note is committed with the repository. Relink a note when the source text moves.
- Translators: check the Code Explainer side panel or the marker on the passage before translating. A note is guidance addressed to you, not copy for the page: use the concrete value it supplies at the right place in the page, such as putting a locale-specific URL into that link's target. Do not paste the note's own wording into the Markdown, since that would mix translator-facing instructions into the translated article.

## Translation scope

Decide whether content should be translated before you start.

### What to translate

- Article body text
- Textual frontmatter: the test is whether site visitors read the text as content, such as `title`, `description` and the text in the homepage `features`
- Display text in MDC containers and components: keep the container type, component name and parameter names as they are, but translate parameter values shown to readers
- UI messages shown to users
- Display text in `site.yml`, such as navigation labels, buttons, hints and the footer
- Image alt text, which lets readers understand the image when it fails to load
- Links and resource addresses such as images: use the address for the target language, unless an author note specifies one

### Files that do not need translation

- Tool documentation: `frontmatter.md`, `md-enhance-guide.md`.
- Templates and static assets: `blog/[path].md`, `pages/public/**`.

Lunaria does not track these files, so they do not appear on the article progress dashboard.

### What to keep unchanged

**Markdown and MDC syntax**

- Syntax markers such as headings, lists, quotes and code fences.
- Container markers, parameter separators, attribute markers and explicit heading anchors. Keep component and parameter names as they are, but translate the text shown to users.

**Program identifiers**

- YAML keys, the part to the left of the colon.
- Frontmatter fields and their values that control layout or behavior, such as `layout`, `aside` and `search`.
- vue-i18n `{name}` placeholders, `|` plural separators and component slot names.

**Matching rules**

- Regular expressions and title matching strings in `site.yml` and shared configuration.
- Menu arrays are matched by index, so do not reorder them across locales.

**Code**

- Commands, arguments, paths and code samples in fenced and inline code.

## Translation rules

- Translate from the Chinese source and retain its page structure. Handle the content listed in [Translation scope](#translation-scope) as described there.
- For site-specific Markdown syntax such as cards, timelines, and custom emoji, see the [Markdown enhancements guide (Chinese)](https://yuanshen.site/docs/md-enhance-guide).
- If a page is unavailable in a locale, link to an existing translation and label its language.
- Follow the [forum glossary](./forum-glossary.md) for forum messages. Check short labels, interpolated values and links in the affected page.
- Review each warning against the source text and its use on the page. Update the translation when the source changes.

## Checks and submission

Run the checks that apply to your changes. The command-to-change mapping is in the [development guide](../contributing/development-guide.md#检查范围). For UI message or site configuration changes, run `pnpm build` as well.

In the pull request, describe the language, changed content and checks performed. Commit source files only. Exclude `dist/` and generated fonts.

See the [i18n development guide](../../../scripts/x18n/README.md#命令说明) for command behavior, file writes and Vue usage.
