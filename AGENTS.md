# Repository Guidelines

## Project Structure & Module Organization
Content lives in `src`, with locale folders (`src/en`, `src/zh`, `src/ja`) for language-specific pages and shared Vue components under `src/components`. Data-driven modules and composables sit in `src/_data`, `src/services`, `src/stores`, and `src/composables`. Site chrome, themes, and routing are owned by `.vitepress`, while utility scripts (blog/member refresh, emoji loader) are in `scripts`. Built assets land in `dist/`, so commit only source changes.

## Build, Test, and Development Commands
Run `corepack enable && pnpm install` before first use. `pnpm dev` launches VitePress locally. `pnpm build` (alias `pnpm build-vitepress`) produces the static docs served at `/docs/`. Use `pnpm build-data` when updating member or blog data; the command chains `use-data-env`, `build-member`, `pnpm lint`, `pnpm typecheck`, and `pnpm lint:md` keep TS, Vue, and Markdown quality in check. For Chinese copy edits run `pnpm lint:zh` (and `pnpm lint:zh-fix` to auto-fix common issues).

## Coding Style & Naming Conventions
The repo enforces 2-space indentation and LF endings via `.editorconfig`. Follow ESLint rules defined in `eslint.config.ts`, UnoCSS utilities, and the existing component catalogue. Vue single-file components stay PascalCase (e.g., `TeamCard.vue`), composables use `useX`, stores follow `useXStore`, and locale-specific markdown keeps kebab-case filenames. Prior to committing, rely on `pnpm lint:eslint-fix` and `pnpm lint:md` to resolve style drift.

## Testing Guidelines
There is no dedicated unit-test harness; quality is maintained through linting, type checks, localized markdown validation, and ensuring `pnpm build` completes without warnings. When touching generated content, rerun the relevant `pnpm build-*` script and spot-check the rendered page via `pnpm dev`. Document manual verification steps in your PR description.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits with commitlint scopes limited to `i18n`, `forum`, `blog`, and `theme`. Use `pnpm commit` (Commitizen) for guided prompts. Keep messages imperative (`feat(theme): add dark header token`). For PRs, include a concise summary, link the tracking issue or task, attach before/after screenshots for UI shifts, and list any data scripts invoked so reviewers can reproduce.

## Data & Localization Tips
Secrets for data refresh live in `.env.data`; never commit real credentials. When editing translated pages, mirror structure across locales and run `pnpm lint:zh` to catch spacing and punctuation issues. Store shared copy in `src/_data` to avoid duplication across languages.