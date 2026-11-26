# 空荧地图文档

[![Check](https://github.com/kongying-tavern/docs/actions/workflows/check.yml/badge.svg)](https://github.com/kongying-tavern/docs/actions/workflows/check.yml)
[![Links](https://github.com/kongying-tavern/docs/actions/workflows/links.yml/badge.svg)](https://github.com/kongying-tavern/docs/actions/workflows/links.yml)
[![Deployment](https://github.com/kongying-tavern/docs/actions/workflows/deployment.yml/badge.svg)](https://github.com/kongying-tavern/docs/actions/workflows/deployment.yml)
[![license](https://badgen.net/github/license/kongying-tavern/docs)](https://github.com/kongying-tavern/docs/blob/main/LICENSE)
[![discord](https://badgen.net/discord/online-members/aFe57AKZUF?icon=discord&label=discord)](https://discord.gg/aFe57AKZUF)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/kongying-tavern/docs)

## Status: WIP

## Contributing

This site uses VitePress. Localized Markdown lives in `pages/zh`, `pages/en`, and `pages/ja`, with static assets in `pages/public`. Page implementations live in `src`. For simple edits, open the Markdown file on GitHub and create a pull request. [VitePress](https://github.com/vuejs/vitepress)

For local development, [pnpm](https://pnpm.io/) is preferred as package manager:

```bash
corepack enable
pnpm i
pnpm run dev
```

The required Node, pnpm and Python versions are listed in the [development guide](./.github/guides/contributing/development-guide.md#环境要求).

## Working on the content

- Use the translation guide to find the locale files and check changes before submitting. [Translation guide](./.github/guides/translation/translation-guide.md#files-and-tools)
- Use `githubPagesOnly: true` in the frontmatter of a page that should ship only on GitHub Pages. [Frontmatter guide](./pages/zh/frontmatter.md)
- See VitePress docs on supported [Markdown Extensions](https://vitepress.vuejs.org/guide/markdown) and the ability to [use Vue syntax inside markdown](https://vitepress.vuejs.org/guide/using-vue).

## License

This project uses separate licenses for different components. See [COPYING.md](./COPYING.md) for detailed information:

- Code: [MIT License](https://github.com/kongying-tavern/docs/blob/main/LICENSE)
- Articles: [CC BY-NC-SA 4.0 License](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Branding: All rights reserved by Kongying Tavern Team
