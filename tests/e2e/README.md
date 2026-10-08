# 论坛浏览器回归

源码位于 `tests/e2e/`，依赖统一由仓库根包管理。

2026-10-08 工作区验证：逻辑测试 508/508、Chromium 全量页面 85/86（8.7 分钟），
根项目与 e2e 类型检查、变更文件 ESLint、`pnpm lint:md` 均通过。
本次修复两条断言了应用里已不存在的文案/属性的用例：搜索空态改为
`未找到“{query}”相关反馈` + `试试其他关键词，或调整筛选条件。`，
二维码改为按卡片内的 `img` 定位（原 `img[alt="QR Code"]` 与三语 alt 都不匹配），
冷启动断言等待放宽到 30s。新增 `reaction.spec.ts`：读取服务端计数、点赞→撤销→反向切换
按服务端权威值写回、写入失败回滚计数；并修正 InterKnot reaction 响应契约
（原先缺 `statusCode` 使浏览器内 reaction 查询恒报错）。
仍有一条固定 sleep 的偶发失败：`mobile-toast`「mobile burst gives each notification its
full display duration」在相邻两次运行中一次失败一次通过，改用 `page.clock` 之前不要把
本地全绿当作门槛。

本机环境有两个会导致大量假失败的陷阱，排查顺序如下：

1. 字体流水线在每次 dev/build 启动时运行。若有另一个 dev server 或进程正在使用
   `src/public/fonts`，Windows 上的原子换目录会失败（`[fonts:subset] error: [WinError 5]`），
   插件抛出后 e2e 的 dev server 会在运行中途退出，表现为大量 `ERR_CONNECTION_REFUSED`。
   先跑一次 `pnpm build:fonts` 命中缓存（约 8 秒）能显著降低触发概率。
2. 被中断的运行会留下半成品依赖缓存 `.vitepress/cache/forum-e2e`，之后的运行会出现
   页面 HTTP 200 正常但组件不挂载、断言全部 `element(s) not found` 的假象。
   删掉该目录重跑即可恢复。

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
| image-previewer | 竖图折叠预览与点击缩放；侧栏折叠状态跨图片与刷新保持 |
| user-drawer | 移动端访客、未关注/已关注、本人；资料页导航与关闭；桌面点击及 hover 不同入口 |
| contact-aside | 首页二维码可见，切换深色主题重新生成 |
| mock-contract | 请求处理器自身：详情/评论互不混淆，未知读取和意外写入被阻止 |
| lazy-interaction | 省流模式、空闲预加载、交互触发加载及慢加载时弹层响应和编辑器焦点 |
| reaction | 话题详情读取服务端计数；点赞→撤销→反向切换按服务端权威值写回；写入失败回滚计数 |
| entry-animation | 文档 header 先于正文入场、减动效同时关闭、blur fade 时长与终态 |
| search-exit | 从列表发起的搜索返回原位、直接搜索 URL 的站内退出，覆盖多宽度 |
| search-facet-transition | 筛选切换在正常与减动效下保持焦点 |
| markdown-rendering | Markdown demo 的类型化 props 与独立 spoiler 属性，覆盖多宽度 |
| mobile-toast | 移动端连续通知的完整时长、队列动作与触摸关闭、诊断卡片在来源消失后仍可读 |
| ui-consistency | 移动端通知位置、窄屏错误卡片的 trace 复制与重试、语言设置面板宽度与标签层级 |
| chunk-recovery | 加载失败只提供一次手动恢复提示、取消恢复保留未发送评论（桌面/移动） |

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
- InterKnot reaction 响应由 `reactionPayload()` 构造并标注 `INTER_KNOT.ReactionResponse`：
  信封或字段改名会在 `pnpm typecheck:forum:ui` 失败，不再依赖运行期才发现契约漂移。
  reaction 状态按 `url` 查询参数分资源保存，读取与 `/api/reactions/add` 写入共享同一份快照。
  需要登录的旅程要显式声明 `scenario.user`，否则 SSO refresh-token 会被记为 unexpected。
- 默认阻止未声明的 Gitee API/OAuth 与 InterKnot API 请求，自动 fixture 在 teardown
  检查 unexpected。静态资源不属于业务 API；需验证失败/上传图片的资源由该用例显式拦截。
- 不读取真实登录状态。认证只使用合成 token；关注和 SSO 响应也被拦截。
- 受 `aria-label` 控制的重复组件（话题与评论各有一个 reaction 组）用 `data-forum-reaction`
  区分作用域，不要依赖 DOM 顺序。

默认入口没有人工截图专用测试。失败保留 trace 与 screenshot，CI 上传 `test-results/forum`
与 `playwright-report`；报告目录按 Playwright 规则相对 config 目录解析，所以 `html`
reporter 的输出路径写成 `../../playwright-report`，落在仓库根目录。截图生成成功不等于
视觉回归通过。后续确需截图比较时，以独立稳定场景和审核过的基准添加，不能用全量更新快照代替判断。

## 仍需人工/部署验证

真实设备软键盘、屏幕阅读器、生产静态服务器深链重写，以及真实 Gitee 写入协议属于
不同环境。当前 Chromium 模拟 viewport 不等同于真机；自动化不写入真实服务。
工作流已接入，但本地通过不等于远端 CI 已执行成功。

此前生产构建成功（有依赖 PURE 注释提示）。带 `/docs/` base 的 VitePress preview
中论坛首页成功挂载；直接访问 `/docs/feedback/topic/123` 返回 404。预览服务不会执行
`vercel.json` 的论坛子路由重写，因此该结果不能替代真实部署验收；未改动现有部署规则。
