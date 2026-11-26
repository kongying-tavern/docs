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

## Testing Guidelines

Test placement, commands and maintenance rules live in [tests/README.md](tests/README.md).

## Commit & Pull Request Guidelines

Commits follow Conventional Commits; the allowed scopes, message format and PR expectations are in the [commit convention](.github/guides/contributing/commit-convention.md).

## Data & Localization Tips

Keep data refresh credentials in `.env.data`. UI messages and localized site settings live in `.vitepress/locales`. For translation or i18n integration tasks, read the [Agent i18n workflow](.agents/i18n.md) first. The [translation guide](.github/guides/translation/translation-guide.md) covers contributor instructions and shared translation rules.
