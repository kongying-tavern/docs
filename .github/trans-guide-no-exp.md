# 翻译入门

按以下步骤在本地编辑并提交翻译。少量文章修改也可以直接在 GitHub 上完成。

## 准备环境

安装 [Git](https://git-scm.com/downloads)、[Visual Studio Code](https://code.visualstudio.com/)、Node.js 和 Python 3。版本与安装命令见[本地开发说明](../README.md#contributing)。

在 GitHub 点击 Fork，将仓库复制到自己的账号下，再用 VS Code 的“克隆存储库”下载到本地。打开项目文件夹，在终端按本地开发说明安装依赖并启动预览。

打开终端显示的地址。按 `Ctrl+C` 停止预览，运行 `pnpm dev` 重新启动。VS Code 提示安装仓库推荐的扩展时，选择安装；x18n 用于编辑词条，YAML 和 Markdownlint 用于检查格式。

## 编辑翻译

1. 按[文件位置](./translation-guide.md#files-and-tools)找到目标语言的文件。新语言需要先[初始化](./trans-guide-new-language.md)。
2. 翻译文章前，先到[认领看板](https://github.com/kongying-tavern/docs/issues/555)查看状态并按说明认领。
3. 文章直接在 VS Code 中编辑。编辑界面词条时运行 `pnpm i18n:ui`，打开终端给出的认证链接；`site.yml` 直接在编辑器中修改。
4. 对照[翻译规则](./translation-guide.md#translation-rules)修改文案，在预览中检查对应语言的页面。

进度看板会在翻译合并并部署后更新。

## 检查和提交

完成[提交前检查](./translation-guide.md#checks-and-submission)后，在 VS Code 的源代码管理中查看改动，提交并推送到自己的 fork，再创建指向主仓库的 Pull Request。
