# 翻译教程（无经验）

## 软件需求

使用架构为[Vitepress](https://vitepress.dev/)，有疑惑可以访问他们的网站检索说明书。

- [Node.js](https://nodejs.org/en/download)（网站运行环境）
- [Visual Studio Code](https://code.visualstudio.com/)（内容编辑器）
- [Git](https://marketplace.visualstudio.com/items?itemName=antfu.vite)（资源管理）
- [Vite插件](https://marketplace.visualstudio.com/items?itemName=antfu.vite)（网站架构官方辅助插件）
- [Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one)

## 工具准备

1. [下载并安装Node.js](https://nodejs.org/en/download)，安装时一直点next就行

2. [下载并安装VSCode](https://code.visualstudio.com/)，打开VSCode，前往资源管理页（Source Control）

![](/src/public/imgs/i18n-guide/2.png)

3. 点击按钮前往弹出的网站[下载并安装Git](https://git-scm.com/download/win)，安装时一直点next就行

![](/src/public/imgs/i18n-guide/3.png)

4. 回到VSCode，前往插件页（Extensions）并搜索“Vite”，点击安装（install）

![](/src/public/imgs/i18n-guide/4.png)

5. 重启VSCode，此步骤用于装载Git

## 资源管理准备

0. 注册一个GitHub账户

1. 前往VSCode账户菜单，选择“Turn on Cloud Changes...”，并登录

![](/src/public/imgs/i18n-guide/6.png)

2. 前往[文档的GitHub页面](https://github.com/kongying-tavern/docs)，并新建一个分支（fork）

![](/src/public/imgs/i18n-guide/1.png)

![](/src/public/imgs/i18n-guide/5.png)

3. 在新建的分支内，复制源码的链接

![](/src/public/imgs/i18n-guide/7.png)

4. 回到VSCode，再次前往资源管理页（Source Control），点击克隆仓库（Clone Repository），并选择从GitHub克隆（Clone from GitHub），VSCode会提示登录，允许（Allow）即可

![](/src/public/imgs/i18n-guide/8.png)

5. 登陆后在解锁的对话框内粘贴刚才复制的源码链接，回车确认并在弹窗中自行选择源码的本地储存地点

![](/src/public/imgs/i18n-guide/9.png)

6. 下载完后打开即可

![](/src/public/imgs/i18n-guide/10.png)

## 编辑准备

1. 打开源码目录以后，Vite插件会在右下角弹出pnpm install提示，点击以安装，这是本地预览所需的必要组件

![](/src/public/imgs/i18n-guide/11.png)

2. 安装完成后，Vite插件会自动启动本地测试服务器于`http://localhost:4000`，并打开一个内置的浏览器，你也可以用自己的浏览器查看预览（注：安装完成后第一次启动可能会有”spawn git ENOENT“错误，重启VSCode即可）

![](/src/public/imgs/i18n-guide/12.png)

3.（推荐）再次前往插件页（Extensions），搜索”Markdown All in One"并安装，这个插件让你可以在VSCode里预览文字格式

4.（推荐）搜索“markdownlint”并安装，这个插件可以为Markdown语法纠错

## 翻译内容

须翻译内容顺序由文件浏览器中显示从上至下（字母顺序），“**”为须翻译的语言代号。（例：ja-日语，kr-韩语）

-  `\.vitepress\config\**.ts` 对应语言的配置，影响所有页面统一的格式

![](/src/public/imgs/i18n-guide/13.png)

- `\src\**\manual` 内的所有内容，文档中有如下图注释（图一），同时注意每一页的fontmatter（图二），这些内容影响当前页的配置

![](/src/public/imgs/i18n-guide/14.png)

![](/src/public/imgs/i18n-guide/15.png)

- `src\en\community.md` 加入社区
- `src\contribution.md` 贡献鸣谢
- `src\en\credits.md` 技术鸣谢
- `src\download-client.md` 下载客户端
- `src\error.md` 错误页
- `src\index.md` 主页
- `src\join.md` 加入我们
- `src\support-us.md` 支持我们

推荐翻译时多运用“查找/替换”功能，以下为一个例子：（将“Kongying Tavern”替换为“空荧酒馆”）

1. 右键需要批量翻译关键词所在的目录，选择“Find in Folder...”

![](/src/public/imgs/i18n-guide/16.png)

2. 在对应的对话框中放入目标内容，点击替换全部（Replace All）即可

![](/src/public/imgs/i18n-guide/17.png)

![](/src/public/imgs/i18n-guide/18.png)

## 上传与同步改动

### 上传

1. 完成一次阶段性改动后，若想上传，前往资源管理页（Source Control），即可查看你所做出的所有改动

![](/src/public/imgs/i18n-guide/19.png)

2. 检查完毕即可输入commit message并推送至你自己的分支，可以将commit看成为阶段性改动的记录。Commit message开头格式可以用：“feat:”-加入新页面、“chore:”-更改页面配置（例如上文所做的替换）、“fix:”-修改语法错误，或者链接错误。更多开通格式见：[commitlint](https://github.com/conventional-changelog/commitlint)

![](/src/public/imgs/i18n-guide/20.png)

3. Commit有三种选择，直接commit将把这次改动储存在本地，“Commit & Push”会把改动commit并推送至你的分支，“Commit & sync”会将改动推送并下载你的分支在云端的改动。

![](/src/public/imgs/i18n-guide/21.png)

### 同步

1. Commit至你的分支以后，前往分支的GitHub页，并发起“Pull Request”就可以开始对网站内容（主分支）的更新流程

![](/src/public/imgs/i18n-guide/22.png)

2. 如果主分支有新的改动，你可以先在“sync fork”处同步（图一，这张图没有同步按钮，因为已经同步），然后在VSCode中点击同步（Sync）将其同步至本地即可（图二）

![](/src/public/imgs/i18n-guide/24.png)

![](/src/public/imgs/i18n-guide/23.png)