# 论坛浏览器回归

源码位于 `tests/e2e/`，依赖统一由仓库根包管理。

2026-10-06 工作区验证：逻辑测试 449/449，Chromium 全量页面测试 68 项通过、
2 项失败；修正导航测试的弹层关闭方式和引用反馈 fixture 后，两项定向复验通过。
根项目、Vue 组件及 e2e 类型检查、中文检查、347 个变更文件的分批 lint 均通过。
生产构建成功，保留两条依赖 PURE 注释提示。全量 ESLint 在本机发生原生进程崩溃，
因此不记为通过；分批检查覆盖本次全部可 lint 的变更文件。
本次使用独立 5284 端口，直接调用已安装的本地工具，绕过包管理器的证书错误；
浏览器产物位于 `test-results/forum-review/`。浏览器测试关闭开发工具悬浮按钮，
防止其遮挡移动端交互入口，日常开发默认仍开启。

2026-10-04 工作区验证记录：逻辑测试 413/413、固定 Chromium 页面测试 30/30，
根项目及 e2e 类型检查、定向 lint 均通过。默认测试端口被占用，本次全量复验使用
独立 5274 端口；其余测试配置保持一致，产物位于 `test-results/forum-final/`。
目录整理提交 `670dc10d` 独立验证为逻辑 319/319、组件浏览器 8 项子测试通过。
论坛 e2e 和新增业务回归仍与对应业务实现保留在工作区，不属于该目录整理提交。

从仓库根目录运行：

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm typecheck:forum:ui
pnpm test:forum:ui:list
pnpm test:forum:ui
```

测试自动启动独立的 VitePress 服务（127.0.0.1:5174），结束时关闭自己启动的服务。
不复用日常开发的 5173 服务。启动需要项目既有 Python/fonttools 字体工具链，见
`requirements.txt`。Linux CI 使用 `playwright install --with-deps chromium`。
Playwright 由根包和根锁文件固定版本，不在 tests/e2e 下安装第二套依赖。

## 场景分类

| 文件 | 验证契约 |
| --- | --- |
| forum-smoke | 列表→详情→后退→前进；直接打开详情；正确的评论数组、正文、作者 |
| comment-navigation | 后页评论深链、焦点与可视区域；目标不存在的结束状态；pending 不显示终态 |
| list-contract | URL 的关键词/类型/排序与真实请求及结果一致，刷新保留；失败后点击重试恢复 |
| empty-state | 搜索空态、用户空态、详情错误及 401/403/500 的不同提示/动作 |
| mobile-comment | 真实 Tiptap 编辑、mention、emoji、附件；关闭重开、失败保留、重试成功清理；上传不重复 |
| publish-topic | 实际发布表单；2xx errors 失败恢复、双击锁、成功刷新列表及再次打开后的清理 |
| image-failure | 图片请求失败后容器/替代图片继续存在，正文仍可读 |
| image-upload | 同内容上传复用、取消隔离、拖放、移动失败重试、动画保留与静态图片压缩 |
| user-drawer | 移动端访客、未关注/已关注、本人；资料页导航与关闭；桌面点击及 hover 不同入口 |
| contact-aside | 首页二维码可见，切换深色主题重新生成 |
| mock-contract | 请求处理器自身：详情/评论互不混淆，未知读取和意外写入被阻止 |
| lazy-interaction | 省流模式、空闲预加载、交互触发加载及慢加载时弹层响应和编辑器焦点 |

老版反馈表单不支持保存、恢复或自动保存草稿，不添加这些功能的正向测试。
领域测试仅验证老版关闭草稿能力；草稿功能的正向验证针对新版 compact 表单。
发布失败保留当前输入并允许重试属于提交事务，与持久化草稿功能分开验证。

## Mock 维护规则

- `fixtures/gitee.ts` 是合成的原始 provider 数据，默认有效对象通过生产 parser 校验；
  领域 Topic/Comment 的单元 fixture 留在 `tests/forum`，不能与原始接口对象混用。
- 字段形状来自当前 provider schema 及 2026-10-04 审查的公开列表/评论 GET 样本；
  写入响应按实际消费者构造，未声称完成所有 Gitee 接口的线上验证。
- 多话题 fixture 要提供不同的 id/number；评论 target、链接、计数与页数据保持关联。
- `support/forum-api.ts` 按 method、精确 pathname、查询参数分派。列表按标签、状态、
  作者、关键词及排序返回结果；按 page/per_page 分页并返回总数头。只实现测试需要的接口。
- `scenario.handle` 用于明确指定失败、延迟或写入响应；写入不得访问真实论坛。
  共用 fixture 在测试后恢复 handle，修改数组的场景必须独立定义数组。
- 默认阻止未声明的 Gitee API/OAuth 与 InterKnot API 请求，自动 fixture 在 teardown
  检查 unexpected。静态资源不属于业务 API；需验证失败/上传图片的资源由该用例显式拦截。
- 不读取真实登录状态。认证只使用合成 token；关注和 SSO 响应也被拦截。

默认入口没有人工截图专用测试。失败保留 trace，CI 上传 `test-results/forum` 与
`playwright-report`；截图生成成功不等于视觉回归通过。后续确需截图比较时，以独立稳定
场景和审核过的基准添加，不能用全量更新快照代替判断。

## 仍需人工/部署验证

真实设备软键盘、屏幕阅读器、生产静态服务器深链重写，以及真实 Gitee 写入协议属于
不同环境。当前 Chromium 模拟 viewport 不等同于真机；自动化不写入真实服务。
工作流已接入，但本地通过不等于远端 CI 已执行成功。

此前生产构建成功（有依赖 PURE 注释提示）。带 `/docs/` base 的 VitePress preview
中论坛首页成功挂载；直接访问 `/docs/feedback/topic/123` 返回 404。预览服务不会执行
`vercel.json` 的论坛子路由重写，因此该结果不能替代真实部署验收；未改动现有部署规则。
