# Adding a Translation Language

This guide explains how to set up a complete translation directory for a new language. To revise existing translations instead, see the [beginner's guide](./trans-guide-no-exp-en.md). Chinese version: [新增翻译语言](./trans-guide-new-language-zh.md).

## Before you start

Adding a language means taking on translation for the whole site, not just a few articles. Confirm three things first:

- The language must be one officially supported by Genshin Impact.
- You plan to translate more than half of the content, including key pages such as the home page, downloads, community, support us and translations, plus site configuration and UI messages.
- Claim articles on the [translation claim board](https://github.com/kongying-tavern/docs/issues/555) as instructed. The board sets the deadline.

## Initialize

### Generate the initial files

After setting up your [local environment](../../../README.md#contributing), run:

```sh
pnpm init:locale
```

The command uses an existing locale as a template to generate the articles and message files the new language needs, and writes the language name and tag. It never overwrites existing content: naming a directory that already exists produces an error.

### Answer the prompts

The command asks for four pieces of information in order:

- **Locale code**: such as `en`, mapped to `--code`
- **Language name**: the name shown to readers, mapped to `--label`
- **Language tag**: in BCP-47 format, such as `en` or `en-US`; when omitted, the locale code is used, mapped to `--lang`
- **Template**: copy content from `zh` or `en`, defaulting to `zh`, mapped to `--template`

All four can also be passed directly with `--code`, `--label`, `--lang` and `--template`.

### How the new language is detected

VitePress and the translation dashboards scan `.vitepress/locales` automatically, so no manual registration is needed. The generated files already contain site text and UI messages; the remaining work is to translate them into the target language.

## Finish the translation

1. Translate the articles under `pages/zh/` into the new language, starting with the key pages.
2. Translate all the copied YAML files, including the site text and the language suggestion banner in `site.yml`. Changes to `site.yml` are reloaded by VitePress.
3. Add the new entry to the language list in each locale's `translations.md`.
4. Review the wording against the [translation scope](./translation-guide-en.md#translation-scope), complete the [submission checks](./translation-guide-en.md#checks-and-submission), then open a pull request.
