# Repository Guidelines

## Development Basics

The [development guide](.github/guides/contributing/development-guide.md) covers the repository layout, import conventions, Markdown extension registration, build commands and coding conventions. Read it before changing code or structure.

## Checks by Change Type

Choose checks by what changed rather than defaulting to `pnpm lint`.

| Change | Required check |
| --- | --- |
| Any `*.md` under `pages/`, `.github/**/*.md` or the repo root | `pnpm lint:md` |
| `pages/zh/**/*.md` | also `pnpm lint:zh` |
| `.vitepress/locales/**/*.yml` | `pnpm i18n:check` |
| Code (`*.ts`, `*.vue`, `*.js`, `*.mjs`, `*.cjs`, `*.mts`, `*.cts`, plus JSON/YAML/CSS) | `pnpm lint:eslint` (`eslint --cache .`) |
| Anything that changes types | `pnpm typecheck` |
| `tests/e2e/**` | also `pnpm typecheck:forum:ui` |

`pnpm lint` covers ESLint and `pnpm lint:zh` only, not `pnpm lint:md`. The pre-commit hook only runs `eslint --fix` on staged code files, so run the checks for your change yourself before committing. Scope details and autofix commands are in the [development guide](.github/guides/contributing/development-guide.md).

## Writing Guides

When you create or rewrite documentation, follow the [content guide](.github/guides/contributing/content-guide.md) for structure, examples and concision. Its rules apply to generated text as well.

AI-specific constraints:

- Write the final design only. Do not add candidate options, rejected alternatives or drafting history.
- Do not invent missing values. If a value is unknown, leave it marked as pending instead of filling it with a plausible default.
- Keep setup, preview and tool installation in their existing canonical documents; link instead of repeating them.
- Place contributor guides in `.github/guides/contributing/` and translation guides in `.github/guides/translation/`.

### Markdown Reference Definitions

Markdown reference definitions (`[text][label]` for links, `![alt][label]` for images) keep destinations in one place, so an address change does not have to be repeated and missed across a document. This is a recommended workflow, not a requirement.

When following it:

- Use `link:xxx` labels for links and `img:xxx` for images.
- Write an alt for every image whose content is known, describing what the image shows so readers know what it is for when it cannot be displayed.
- Put extracted definitions at the end of the relevant section; choose small-section or large-section granularity by practical need.
- Extract same-page anchor links as well. Give every heading a semantic `{#xxx}` anchor so any heading can be targeted.
- Leave Placeholder components and links whose destination is still pending out of the definition blocks.

If an author explicitly asks to normalize a document to this workflow, confirm the concrete choices before editing: which of the optional points above apply, which range of link and image destinations to extract, and where the definitions should be placed.

## Author Notes

The original author may attach supplementary notes to a Markdown document for later contributors, most often translators. Keep these notes in the VS Code extension `aristidekamara.code-explainer-notes` and its `.vscode/code-comments.json` sidecar, not in Markdown source. A note such as a locale-specific URL is guidance, not rendered page content, and writing it into the page would pollute the document. When translating or changing an annotated passage, read the matching note first. Notes are guidance for the writer, not copy for the page: apply the concrete value a note supplies at the right place, such as using a locale-specific URL as a link target, but never paste the note's own wording into Markdown or treat the sidecar as page content. Contributor-facing instructions live in the translation guides ([中文](.github/guides/translation/translation-guide-zh.md#作者备注) / [English](.github/guides/translation/translation-guide-en.md#author-notes)).

## Testing Guidelines

Test placement, commands and maintenance rules live in [tests/README.md](tests/README.md).

## Commit & Pull Request Guidelines

Commits follow Conventional Commits; the allowed scopes, message format and PR expectations are in the [commit convention](.github/guides/contributing/commit-convention.md).

## Data & Localization Tips

Keep data refresh credentials in `.env.data`. UI messages and localized site settings live in `.vitepress/locales`. For translation or i18n integration tasks, read the [Agent i18n workflow](.agents/i18n.md) first. The translation guides ([中文](.github/guides/translation/translation-guide-zh.md) / [English](.github/guides/translation/translation-guide-en.md)) cover contributor instructions and shared translation rules.
