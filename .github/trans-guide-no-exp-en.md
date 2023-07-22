# Docs Translation Guide (No Experience)

## Software Needed

This site uses [Vitepress](https://vitepress.dev/), you can refer to their website for more information.

- [Node.js](https://nodejs.org/en/download) (JavaScript runtime environment)
- [pnpm](https://pnpm.io/) (Package Manager)
- [Visual Studio Code](https://code.visualstudio.com/) (Source Editor)
- [Git](https://marketplace.visualstudio.com/items?itemName=antfu.vite) (Source Management)
- [Vite Extension](https://marketplace.visualstudio.com/items?itemName=antfu.vite) (Offical VSCode Extension)
- [Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one) (Markdown Toolkit Extension)
- [Iconify IntelliSense](#)

## Tool Prep

> You can also use VSCode Web, simply press `.` at the Github page when logged in will open the repository in VSCode Web
>
> Working with VSCode web does not require following preparations, please skip to [#Translation Items](#Translation Items) below
>
> VSCode web has various limitations, you will not have access to preview and terminals, see <https://code.visualstudio.com/docs/editor/vscode-web> for details

1. [Download and install Node.js](https://nodejs.org/en/download)

2. [Download and install VSCode](https://code.visualstudio.com/), launch VSCode, and head to "Source Control"

![](/src/public/imgs/i18n-guide/2.png)

3. Click the button to [download and install Git](https://git-scm.com/download/win) from the webpage

![](/src/public/imgs/i18n-guide/3.png)

4. Return to VSCode, head to "Extensions" search for "Vite" and install

![](/src/public/imgs/i18n-guide/4.png)

5. Relaunch VSCode to load Git

6. Select "View” in the navigation menu and then select "Terminal"

![](/src/public/imgs/i18n-guide/25.png)

7. Enter the following command and hit enter to install pnpm

```
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

8. Next, select the “+” menu in the terminal section, and then open "Git Bash"

![](/src/public/imgs/i18n-guide/26.png)

9. Enter the following commands into the terminal one at a time and hit enter, replace "username" and "youremail" with relevant information

```
git config --global user.name "username"

git config --global user.email "youremail"
```

![](/src/public/imgs/i18n-guide/27.png)

## Source Management Prep

0. Sign up for a GitHub account

1. Head to VSCode's Accounts menu, Select "Turn on Cloud Changes..." and log in

![](/src/public/imgs/i18n-guide/6.png)

2. Visit the [GitHub page of our site](https://github.com/kongying-tavern/docs), and create a new "fork"

![](/src/public/imgs/i18n-guide/1.png)

![](/src/public/imgs/i18n-guide/5.png)

3. In that new "fork", copy the link to your repository

![](/src/public/imgs/i18n-guide/7.png)

4. Return to VSCode, head to"Source Control" again, click "Clone Repository", and select "Clone from GitHub", VSCode will prompt you to allow login, simply allow

![](/src/public/imgs/i18n-guide/8.png)

5. Paste the link to your repository into the text box, hit Enter to confirm and clone the repository to a directory of your choice

![](/src/public/imgs/i18n-guide/9.png)

6. Open once the download is completed

![](/src/public/imgs/i18n-guide/10.png)

## Editing Prep

1. Once you open the cloned repository folder, the Vite extension will display a `pnpm install` prompt at the bottom right, click install, this is necessary for local preview

![](/src/public/imgs/i18n-guide/11.png)

2. Once the installation completes, the Vite extension will automatically start a local test server at `http://localhost:4000`, and open a build-in browser, you can also use your own browser by visiting the address there(you may encounter problems right after installation, relaunch to VSCode if error occurs)

![](/src/public/imgs/i18n-guide/12.png)

3. (Recommended)Head to the "Extensions" page again, search for "Markdown All in One" and install, this extension allows you to preview text styles (bold, italic, etc.) in the VSCode editor

4. (Recommended) Seach for "markdownlint" and install, this extension can correct Markdown grammar

5. (Recommended) Search for "antfu.iconify” and install, this extension provides inline icon previews

## Translation Items

The following content that requires translation is listed in the order they appear in the file explorer (alphabetically),"\*\*" refers to the language code of a certain language(e.g. ja-Japanese,fr-French)

- `\.vitepress\config\**.ts` Configuration of its respective language, affects all pages' format in that language

![](/src/public/imgs/i18n-guide/13.png)

- `\src\**\manual` All content requires translation, you need to configure each page's "frontmatter"(second picture below), which affects that specific page's format

![](/src/public/imgs/i18n-guide/14.png)

![](/src/public/imgs/i18n-guide/15.png)

- `src\**\community.md`
- `src\**\contribution.md`
- `src\**\credits.md`
- `src\**\download-client.md`
- `src\**\error.md`
- `src\**\index.md`
- `src\**\join.md`
- `src\**\support-us.md`

It is recommended to use "Find and Replace" smartly, see the following example: (replacing "Kongying Tavern" with "空荧酒馆")

1. Right-click on the directory where Find and Replace is needed, select "Find in Folder..."

![](/src/public/imgs/i18n-guide/16.png)

2. Enter target keywords into their respective text box, select Replace to replace one by one, or Replace All as needed

![](/src/public/imgs/i18n-guide/17.png)

![](/src/public/imgs/i18n-guide/18.png)

## Submit and Sync Changes

### Submission

1. If you want to submit changes at a certain stage, head to Source Control to view all the changes

![](/src/public/imgs/i18n-guide/19.png)

2. After checking your changes, enter a commit message and commit your changes, you can view a "commit" as a record of changes. A format is required for the commit message for our website, you should open with feat:, chore:, fix:, etc. You can see commit message standards here：[commitlint](https://github.com/conventional-changelog/commitlint)

![](/src/public/imgs/i18n-guide/20.png)

3. There are three kinds of commits, using "commit" only will save the changes locally, "Commit & Push" will upload your commit to the online repository of your fork, "Commit & sync" will upload your local change and download from your online repository if they differ.

![](/src/public/imgs/i18n-guide/21.png)

### Sync

1. Once you have committed to your own fork, head to its GitHub page and initiate a Pull Request, this will begin the update process to the website

![](/src/public/imgs/i18n-guide/22.png)

2. If the website was updated, you can use "sync fork" to update your own fork, and click on "Sync" in VSCode to update the changes to your local repository

![](/src/public/imgs/i18n-guide/24.png)

![](/src/public/imgs/i18n-guide/23.png)
