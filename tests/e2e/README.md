# 论坛浏览器回归

浏览器测试按运行环境分为两个门槛，CI 都执行且不自动重试：

- **production**：对 `/docs/` base 的真实构建产物运行用户流程、SSR hydration 和 chunk 加载检查。
- **source**：带 `@source` 标签，验证源码模块拦截、浏览器内直接导入、Vue 实例操作等专项行为。
  这些测试需要开发服务器，不能用来代替生产构建验证。混合文件按单条用例标记，不按文件整体排除。

从仓库根目录运行：

```sh
pnpm exec playwright install chromium
pnpm typecheck:forum:ui
pnpm test:forum:ui:build
pnpm test:forum:ui:production
pnpm test:forum:ui:source
```

`test:forum:ui:build` 输出到忽略的 `.vitepress/cache/forum-ui-build`，不覆盖日常预览的 `dist`。
生产测试复用该产物，代码修改后先重新构建。两个命令都自动启动独立的 5174 服务并在结束时关闭，
本地依次运行；CI 用 matrix 独立执行，失败产物按 suite 命名。
本地若用 `FORUM_E2E_PORT` 并行启动不同端口，trace 和 HTML 报告也按 suite 与端口隔离；
同端口的定向检查应等待上一轮结束，或显式指定独立 `--output`。
`pnpm test:forum:ui` 保留开发服务器下的完整本地入口，生产专用用例在这个模式下跳过。
使用 `--list` 查看对应命令选中的用例，使用文件名或 `--grep` 做定向复验。

移动端侧栏与登录弹窗的遮挡检查也可在 WebKit 下单独运行：

```sh
pnpm exec playwright install webkit
pnpm exec playwright test --config tests/e2e/playwright.webkit.config.ts
```

此配置只运行 `sidebar-overlay`，覆盖手机和平板宽度；iOS Safari 真机仍需单独验证。

导航使用相对 URL（例如 `page.goto('feedback/topic/123')`），让 Playwright 的 baseURL
处理 `/docs/` 前缀。生产测试 fixture 模拟部署的论坛子路由 fallback，并检查 hydration 错误；
真实部署的静态服务器重写仍需要单独验证。

启动需要项目既有 Python/fonttools 字体工具链，见 `requirements.txt`。
Playwright 由根包和根锁文件固定版本；Linux CI 安装 Chromium 时使用 `--with-deps`。
Windows 上若被中断的 dev 运行留下损坏缓存，可将 `.vitepress/cache/forum-e2e` 改名后重新运行；
不要把缓存问题用重试或增加超时掩盖。

## 断言与定位规则

- 行为测试断言 URL、请求参数、输入保留、状态转换和焦点；不要用具体翻译文案代替行为结果。
- 有稳定的字段 ID 或语义属性时直接复用；确实缺少时才添加 `data-testid`，值表达动作或职责。
  不为每个 DOM 元素加测试标识，也不把 CSS 布局类当成业务契约。
- 可访问性断言保留 role、非空可访问名称、键盘操作和焦点。文案专项只在需要固定措辞时使用独立预期，
  不直接读取生产翻译对象作为正确答案。
- 网络与异步动作通过 fixture 显式挂起和释放；等待可观察状态或有限动画结束，不用固定 sleep 猜完成时间。
  `page.clock` 专门验证持续时间和过期边界。手势采样间隔属于输入模拟，可以保留。
- 浏览器变换后的几何值使用小且明确的浮点容差。新增尺寸/排版组合优先归入专门的布局检查，
  不塞进发布、登录等事务流程。
- 参数组合和业务失败分支优先放在 `tests/forum`；E2E 保留真实组件接起来的关键流程。

## 场景分类

| 文件 | 验证契约 |
| --- | --- |
| forum-smoke | 列表→详情→后退→前进；直接打开详情；正确的评论数组、正文、作者 |
| comment-navigation | 后页评论深链、焦点与可视区域；目标不存在的结束状态；pending 不显示终态 |
| list-contract | URL 的关键词/类型/排序与真实请求及结果一致，刷新保留；页内换词与侧栏标签不改地址路径也即时重查；失败后点击重试恢复 |
| empty-state | 搜索空态、用户空态、详情错误及 401/403/500 的不同提示/动作 |
| mobile-comment | 真实 Tiptap 编辑、mention、emoji、附件；关闭重开、失败保留、重试成功清理；上传不重复 |
| publish-topic | 实际发布表单；2xx errors 失败恢复、双击锁、成功刷新列表及再次打开后的清理 |
| image-failure | 图片请求失败后容器/替代图片继续存在，正文仍可读 |
| image-upload | 同内容上传复用、取消隔离、拖放、移动失败重试、动画保留与静态图片压缩 |
| image-previewer | 竖图折叠预览与点击缩放；侧栏折叠状态跨图片与刷新保持 |
| user-drawer | 移动端访客、未关注/已关注、本人；资料页导航与关闭；桌面点击及 hover 不同入口 |
| contact-aside | 站点首页确实渲染；footer 二维码可见，切换深色主题重新生成 |
| mock-contract | 请求处理器自身：详情/评论互不混淆，未知读取和意外写入被阻止 |
| lazy-interaction | 省流模式、空闲预加载、交互触发加载及慢加载时弹层响应和编辑器焦点 |
| reaction | 话题详情读取服务端计数；点赞→撤销→反向切换按服务端权威值写回；写入失败回滚计数 |
| entry-animation | 文档 header 先于正文入场、减动效同时关闭、blur fade 时长与终态 |
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

## 时间与模块加载

- 断言通知时长这类时间线时用 `page.clock`：`install()` 之后真实时间仍在流动，必须再调用
  `pauseAt()` 才会冻结；冻结后 `runFor()` 能精确定位边界（通知 4000ms 生命周期、退出动画后
  再 unmount 的 200ms）。依赖 CSS 动画/`requestAnimationFrame` 的等待保持真实时间，不要
  放进冻结的时钟里。
- 通过 `page.evaluate` 驱动某个模块前先调 `support/modules.ts` 的 `warmModules()`：
  让源码模块在冻结时钟或开始断言前加载完成；该 helper 不重试失败导入。
  Vite 通过主题入口预扫描依赖，冷启动重载由专项用例检查。
- `scenario` 是 option fixture，同一个 worker 内所有用例共用同一对象；自动 fixture 会在用例
  结束后按快照还原（含 `topics`/`comments` 数组内容）。用例仍可在测试中改 scenario 让 mock
  响应变化，但改动不会漏给下一条用例。

默认入口没有人工截图专用测试。失败保留 trace 与 screenshot，CI 上传 `test-results/forum`
与 `playwright-report`；报告目录按 Playwright 规则相对 config 目录解析，所以 `html`
reporter 的输出路径写成 `../../playwright-report`，落在仓库根目录。截图生成成功不等于
视觉回归通过。后续确需截图比较时，以独立稳定场景和审核过的基准添加，不能用全量更新快照代替判断。

## 仍需人工/部署验证

真实设备软键盘、屏幕阅读器、生产静态服务器深链重写，以及真实 Gitee 写入协议属于
不同环境。当前 Chromium 模拟 viewport 不等同于真机；自动化不写入真实服务。
工作流已接入，但本地通过不等于远端 CI 已执行成功。
