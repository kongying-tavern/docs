---
layout: doc
titleTemplate: Kongying Tavern
---

# Genshin Interactive Map Community Translation Guidelines

If you are here, you are likely interested in contributing to the translation of the Genshin Interactive Map documentation. Thank you! Before you start, make sure to read the following guidelines to get an understanding of the workflow.

## High Level Steps of Working on a New Translation

1. Open a thread in the Discussion tab to indicate your intention of working on a translation. Make sure to check if there is already one created for your language - this can help avoid duplicated efforts. Use the thread to find fellow collaborators to form a translation team. We strongly suggest working as a team because peer reviews are necessary to ensure translation quality.

2. Fork [kongying-tavern/docs](https://github.com/kongying-tavern/docs) to start the translation process in your own repo (you can create a dedicated organization for it if you want). Make sure to read the [Workflow Recommendations](#workflow-recommendations) section below before you start! Feel free to deploy your own preview with Vercel or Netlify during this phase.

3. Send us a Pull Request to add your WIP repo to the end of this README file.

   Some Notes:

   - Before performing the transfer, use the GitHub support request to [detach your fork](https://support.github.com/request/fork). This is necessary because GitHub doesn't allow multiple forks of the same source repo to co-exist in the same organization.

   - When you first transfer the repo, you likely won't have write access to it because the repo will need to be assigned to the team for proper permissions, let us know once the transfer is done so we can set it up.

   - For consistency, the team and repo names are determined based on the [ISO 639-1 language codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes).

4. Once translation is finished, we will move it from WIP to completed languages on `yuanshen.site`, and announce the translation from the official Twitter account!

## Workflow Recommendations

### Setup

Read the [Contributing Section](https://github.com/kongying-tavern/docs#contributing) of the docs. Make sure to use `pnpm` and Node.js v14+. Familiarize yourself with [VitePress' markdown extension features](https://vitepress.vuejs.org/guide/markdown.html).

### Use Issues and Pull Requests

It's recommended to manage the workload using issues and pull requests. Create an issue for each page that still needs translation, then let team members self-assign to claim the work. Create a pull request for the translation of each page. This way, other collaborators can review and provide feedback before the the PR is merged. It is also recommended to use "Squash and Merge" for the PRs so you have a clean history.

### Document Translation Conventions

When working as a team, make sure to use consistent translations for common terminologies to avoid confusion. It's best to have a place to document the conventions and consensus generated from reviews. You can use GitHub wiki, team discussions thread, or directly as a markdown file in the repo itself. If a term is particularly tricky to concisely translate in your language, consider leaving it untranslated.

### Translating Non-Content Text

Some text are part of the VitePress theme instead of markdown content. You can translate these in `.vitepress/config/[langCode].ts`. In addition to navigation and sidebar items, you can also customize most of the theme text by providing the `themeConfig.i18n` option. [Example usage in English translation](https://github.com/kongying-tavern/docs/blob/next/.vitepress/config/en.ts)

### Retaining Original Anchors

VitePress automatically generates header anchor links (links that start with `#`) based on the text. Since we have a lot of cross-linking to headers within the site, it is easier to retain original Chinese header links so that you don't need to update links everywhere when you translate the headers. It also makes it easier to switch between different languages of the same header link.

We already added header anchor links in the original Chinese document, use the following syntax when translating to retain them:

```diff
- ## Original Header {#original-header}
+ ## Translated Header {#original-header}
```

You may also notice that some headers are followed by one or two `\*` markers:

```md
### `<script setup>` \*\* {#script-setup}
```

These are custom markers we use to differentiate between Options-API-only and Composition-API-only sections. We use a custom markdown plugin to wrap these sections in additional divs that can be shown / hidden by toggling CSS classes. Please keep them when translating the headers!

## Complete Translations

- [简体中文 / Simplified Chinese](index.md/) [[source](https://github.com/kongying-tavern/docs/tree/next/src/)]
- [英文 / English](./en/index.md) [[source](https://github.com/kongying-tavern/docs/tree/next/src/en)]

## Current Active Translations (in alphabetical order)

- [日本語 / Japanese](./ja/index.md) [[source](https://github.com/kongying-tavern/docs/tree/next/src/ja)]
- [韩语 / Korean](./kr/index.md) [[source](https://github.com/kongying-tavern/docs/tree/next/src/kr)]

## Resources

### Software

- [Grammarly](https://www.grammarly.com/): Desktop app and browser extension for checking spelling and grammar (though grammar checking doesn't catch everything and occasionally shows a false positive).
- [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker): An extension for VS Code to help you check spelling within markdown and code examples.

### Books

- [On Writing Well](https://www.amazon.com/Writing-Well-30th-Anniversary-Nonfiction-ebook/dp/B0090RVGW0) (see [popular quotes](https://www.goodreads.com/work/quotes/1139032-on-writing-well-the-classic-guide-to-writing-nonfiction))
- [Bird by Bird](https://www.amazon.com/Bird-Some-Instructions-Writing-Life/dp/0385480016) (see [popular quotes](https://www.goodreads.com/work/quotes/841198-bird-by-bird-some-instructions-on-writing-and-life))
- [Cognitive Load Theory](https://www.amazon.com/Cognitive-Explorations-Instructional-Performance-Technologies/dp/144198125X/)
