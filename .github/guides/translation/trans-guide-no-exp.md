# 翻译入门

这份指南带你在本机完成一次翻译：准备工具、找到文件、修改内容、检查并提交。少量文章修改也可以直接在 GitHub 上完成。

## 准备环境

### 本地预览

用 `pnpm dev` 启动本地预览，安装依赖的命令和预览地址见[本地开发说明](../../../README.md#contributing)。

- 改动保存后页面会自动更新，一般不用手动重启。
- 需要停止预览时，在终端按 `Ctrl+C`。下次查看时重新运行 `pnpm dev`。

### 编辑工具

打开项目时，VS Code 会提示安装仓库推荐的扩展，选择安装即可。它们各自的作用：

- **x18n**：界面词条的本地编辑器，运行 `pnpm i18n:ui` 后通过终端给出的认证链接访问，保存时写回 YAML。
- **YAML、Markdownlint**：分别检查配置文件和 Markdown 的格式。
- **[Code Explainer Notes](https://marketplace.visualstudio.com/items?itemName=AristideKamara.code-explainer-notes)**：必须安装。原始书写者留下的[附加说明](./translation-guide.md#author-notes)只有通过该插件才能看到，所有人都安装后才能看到同一份备注。翻译前先检查相关段落是否有备注。

### 取得项目副本

在 GitHub 点击 Fork，把仓库复制到自己的账号下，再用 VS Code 的“克隆存储库”下载到本地。之后在这个副本上修改，通过 Pull Request 提交回主仓库。

## 编辑翻译

### 找到目标文件

文章在 `pages/<语言>/` 下，界面词条在 `.vitepress/locales/<语言>/` 下（`site.yml` 除外）。完整对应关系见[文件位置](./translation-guide.md#files-and-tools)。新语言需要先[初始化](./trans-guide-new-language.md)。

### 认领文章

翻译文章前，先到[认领看板](https://github.com/kongying-tavern/docs/issues/555)查看状态并按说明认领，避免和别人重复翻译同一篇。

### 修改内容

- **文章**：Markdown 文件，直接在 VS Code 中编辑。
- **界面词条**：运行 `pnpm i18n:ui`，用终端给出的认证链接打开词条编辑器，在里面修改并保存，改动会写回对应的 YAML 文件。
- **站点配置**：`site.yml` 除文案外还存放导航菜单、链接、匹配规则等设置。它可以用上面那个词条编辑器改，也可以直接在 VS Code 里编辑 YAML。两种方式修改的是同一个文件，效果相同。
- 对照[翻译规则](./translation-guide.md#translation-rules)修改文案，并在预览中检查对应语言的页面。

## 检查和提交

完成[提交前检查](./translation-guide.md#checks-and-submission)后，在 VS Code 的源代码管理中查看改动，提交并推送到自己的 fork，再创建指向主仓库的 Pull Request。

进度看板会在翻译合并并部署后更新。
