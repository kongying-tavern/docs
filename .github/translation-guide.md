# Translation Guide

Use this guide to translate the documentation site. For map client translations, see the [translations page](https://yuanshen.site/docs/translations/#translations-client).

Local setup: [中文教程](./trans-guide-no-exp.md) · [English tutorial](./trans-guide-no-exp-en.md). To add a language, follow the [new language guide (Chinese)](./trans-guide-new-language.md).

## Files and tools

| Content | Files | Editing |
| --- | --- | --- |
| Articles | `pages/<locale>/**/*.md` | Markdown editor |
| UI messages | `.vitepress/locales/<locale>/*.yml`, except `site.yml` | `pnpm i18n:ui` |
| Site configuration | `.vitepress/locales/<locale>/site.yml` | `pnpm i18n:ui` or YAML editor |

[Lunaria](https://yuanshen.site/docs/_translations/) tracks articles; [x18n](https://yuanshen.site/docs/_i18n/) tracks UI and site text. Both published dashboards are read-only. Submit changes through a pull request.

Claim articles on the [claim board](https://github.com/kongying-tavern/docs/issues/555), which lists the commands and deadlines. For UI messages, edit the YAML files and submit a pull request. Leave shared configuration and generated files unchanged.

## Author notes

The original author may leave notes beside a Markdown page to pass context to translators, such as locale-specific URLs. These notes are stored by the VS Code extension [Code Explainer Notes](https://marketplace.visualstudio.com/items?itemName=AristideKamara.code-explainer-notes) (`aristidekamara.code-explainer-notes`) in the shared workspace file `.vscode/code-comments.json`; they are not part of the page source.

The extension is **required for all contributors**: notes are visible only through it, so every translator must install it to see the same guidance. It is listed in `.vscode/extensions.json`, and VS Code prompts you to install it when you open the workspace.

- Authors: select the relevant text and run `Code Explainer: Add Comment`, then save in shared storage mode so the note is committed with the repository. Relink a note when the source text moves.
- Translators: check the Code Explainer side panel or the marker on the passage before translating. A note is guidance addressed to you, not copy for the page: use the concrete value it supplies at the right place in the page, such as putting a locale-specific URL into that link's target. Do not paste the note's own wording into the Markdown, since that would mix translator-facing instructions into the translated article.

## Translation rules

- Translate from the Chinese source and retain its page structure. Translate frontmatter titles and descriptions; keep explicit heading anchors such as `{#installation}` and component names.
- For site-specific Markdown syntax such as cards, timelines, and custom emoji, see the [Markdown enhancements guide (Chinese)](../pages/zh/md-enhance-guide.md).
- Keep YAML keys, `{name}` placeholders, component slot names and plural separators `|`. x18n also lists links and regular expression patterns in `site.yml`; change them only when the task calls for it.
- Keep menu grouping and order aligned across locales: array entries are matched by index. If a page is unavailable in a locale, link to an existing translation and label its language.
- Follow the [forum glossary](./forum-glossary.md) for forum messages. Check short labels, interpolated values and links in the affected page.
- Review each warning against the source text and its use on the page. Update the translation when the source changes.

## Checks and submission

Run the checks that apply to your changes:

| Change | Commands |
| --- | --- |
| Markdown | `pnpm lint:md` |
| UI messages or `site.yml` | `pnpm i18n:check` |
| Chinese articles | `pnpm lint:zh` |
| Vue or TypeScript | `pnpm typecheck` |

Preview with `pnpm dev` and open the URL printed by VitePress. Before submitting UI or site configuration changes, run `pnpm build` too.

In the pull request, describe the language, changed content and checks performed. Commit source files only; exclude `dist/` and generated fonts.

See the [i18n development guide](../scripts/x18n/README.md#命令说明) for command behavior, file writes and Vue usage.
