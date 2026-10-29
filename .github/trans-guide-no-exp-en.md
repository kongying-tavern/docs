# Getting Started with Translation

Follow these steps to edit and submit translations locally. Small article changes can also be made directly on GitHub.

## Set up locally

Install [Git](https://git-scm.com/downloads), [Visual Studio Code](https://code.visualstudio.com/), Node.js and Python 3. Use the versions and commands in [local development](../README.md#contributing).

Click **Fork** on GitHub to copy the repository to your account, then use **Clone Repository** in VS Code to download your copy. Open the project folder and run the local development commands in its terminal.

Open the URL printed by the terminal. Press `Ctrl+C` to stop preview and run `pnpm dev` to restart it. Accept the workspace extension recommendations: x18n edits messages, while YAML and Markdownlint help check files.

## Edit a translation

1. Find the target language's files in the [file reference](./translation-guide.md#files-and-tools). To add a language, follow the [new language guide (Chinese)](./trans-guide-new-language.md).
2. Before translating an article, check the [claim board](https://github.com/kongying-tavern/docs/issues/555) and follow its claim instructions.
3. Edit articles in VS Code. For UI messages, run `pnpm i18n:ui` and use the terminal's authentication link. Edit `site.yml` directly.
4. Follow the [translation rules](./translation-guide.md#translation-rules) and preview the affected language page.

The progress dashboards update after translations are merged and deployed.

## Check and submit

Complete the [submission checks](./translation-guide.md#checks-and-submission), review your changes in VS Code Source Control, commit and push to your fork, then open a pull request to the main repository.
