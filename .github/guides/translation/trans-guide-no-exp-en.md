# Getting Started with Translation

This guide walks you through a translation locally: prepare the tools, find the files, edit the content, then check and submit. Small article changes can also be made directly on GitHub.

## Prepare the environment

### Local preview

This site is built with VitePress. `pnpm dev` starts a local preview and prints an address in the terminal; open that address in a browser to see the pages as readers will see them.

- The commands to install dependencies and start the preview are in [local development](../../../README.md#contributing).
- Pages update automatically when you save changes, so a manual restart is usually unnecessary.
- To stop the preview, press `Ctrl+C` in the terminal; run `pnpm dev` again the next time you want to view it.

### Editing tools

When you open the project, VS Code offers to install the repository's recommended extensions. Accept them. Each one has a specific job:

- **x18n**: a local editor for UI messages. Run `pnpm i18n:ui`, open the authentication link printed in the terminal, and save changes back to YAML.
- **YAML and Markdownlint**: check the format of configuration files and Markdown.
- **[Code Explainer Notes](https://marketplace.visualstudio.com/items?itemName=AristideKamara.code-explainer-notes)**: mandatory. The original author's [supplementary notes](./translation-guide.md#author-notes) are visible only through this extension, so everyone must install it to see the same notes. Check the notes for a passage before translating it.

### Get your own copy

Click **Fork** on GitHub to copy the repository to your account, then use **Clone Repository** in VS Code to download it locally. You make all changes in this copy and send them back to the main repository through a pull request.

## Edit a translation

### Find the target files

Articles live under `pages/<locale>/` and UI messages under `.vitepress/locales/<locale>/` (except `site.yml`). See the [file reference](./translation-guide.md#files-and-tools) for the full mapping. To add a language, follow the [new language guide (Chinese)](./trans-guide-new-language.md).

### Claim an article

Before translating an article, check the [claim board](https://github.com/kongying-tavern/docs/issues/555) and follow its instructions so two people do not translate the same piece.

### Make the changes

- **Articles**: Markdown files, edited directly in VS Code.
- **UI messages**: run `pnpm i18n:ui`, open the authentication link printed in the terminal, and edit in the editor that opens. Saving writes your changes back to the corresponding YAML file.
- **Site configuration**: besides messages, `site.yml` holds settings such as navigation menus, links and matching rules. You can edit it in the same editor or directly in VS Code; both ways change the same file with the same result.
- Follow the [translation rules](./translation-guide.md#translation-rules) and preview the affected language page.

## Check and submit

Complete the [submission checks](./translation-guide.md#checks-and-submission), review your changes in VS Code Source Control, commit and push to your fork, then open a pull request to the main repository.

The progress dashboards update after translations are merged and deployed.
