# 测试目录与运行规则

维护中的测试统一放在根目录 `tests/`，生产实现仍留在 `src/`、`.vitepress/` 和 `scripts/`。
按被验证的职责选择目录；文件位置不代表只能写纯单元测试，各领域也包含查询、HTTP 与事务集成测试。

```text
tests/
  forum/                  论坛领域、provider、查询缓存、认证、表单与评论
    fixtures/             领域对象与内容夹具
  shared/                 网站设置、遥测、博客更新与通用可见性服务
  theme/
    fluid-hover/          悬浮几何与弹簧
    unocss/               样式规则
    swipe-actions/        手势逻辑与独立浏览器组件测试
      fixtures/           组件浏览器测试页面
  fonts/                  字体配置、文件和 fallback 构建契约
  e2e/                    Playwright 页面交互旅程
    fixtures/             原始 provider 数据
    support/              Mock 请求处理器和 Playwright fixture
```

| 命令 | 发现范围 |
| --- | --- |
| `pnpm test` | forum、shared、theme、fonts 下所有 `*.test.ts` |
| `pnpm test:list` | 列出上述完整文件清单，不执行 |
| `pnpm test:watch` | 持续监听四类逻辑测试，修改后重跑受影响的测试 |
| `pnpm test:ui` | 启动 Vitest 界面，查看结果、筛选和重跑测试 |
| `pnpm test:coverage` | 运行逻辑测试并生成 `coverage/` 覆盖率报告 |
| `pnpm test:forum` | forum |
| `pnpm test:shared` | shared |
| `pnpm test:theme` | shared + theme，保留主题原有网站设置检查 |
| `pnpm test:fonts` | fonts |
| `pnpm test:forum:ui` | e2e 的 `*.spec.ts`，自动启动 VitePress |
| `pnpm test:theme:ui` | swipe-actions 的 `browser.test.mjs`，自动启动组件测试服务 |

逻辑测试由 `vitest.config.ts` 统一发现并在 Node 环境执行，不依赖 Windows shell 展开 glob。
测试配置独立于站点 Vite 配置，避免运行逻辑测试时启动字体构建或页面调试插件。
文件保持隔离，mock、环境变量和 stub 全局对象在每条测试后自动恢复；使用假定时器的测试
还应在清理钩子中调用 `vi.useRealTimers()`。空测试集和 CI 中的 `test.only` 会导致失败。
可以用 `pnpm exec vitest list tests/forum --filesOnly` 查看单个分类的发现结果，
或用 `pnpm test:watch tests/forum -t "关键词"` 监听指定范围。
现有 `node:assert/strict` 断言继续使用，测试注册、清理、spy 和假定时器改用 Vitest API。

覆盖率显式统计论坛 API、composable、认证、路由、服务、store 和工具，以及共享逻辑、
主题 hooks 与字体流水线；未被导入的文件也纳入统计，Vue 页面与组件不属于这个逻辑指标。
CI 运行完整覆盖率测试并上传 HTML 报告。全局门槛基于当前范围的基线，认证刷新模块另有
行覆盖率 65%、分支覆盖率 60% 的门槛；新增统计范围时应重新评估基线。
shared 套件还通过独立 Node 进程实际验证两份站点配置和三个内容数据加载器的原生加载，检查完整运行时导入链的兼容性。
`tests/fonts` 中依赖 Python 的两项流水线检查在缺少 fontTools/brotli 时标记为 skipped
并保持套件通过，安装了工具链的 CI 仍会真实执行；本地无 Python 时不要把它们当作通过。
测试里的生产模块 mock 必须是边界替身，不要用 `readFileSync` + `node:vm` 之类的方式加载
生产源码：那样会绕开 Vite 别名、丢掉覆盖率归因，并把"依赖清单"变成脆弱的隐式契约。
确实无法在 Node 环境加载的模块（例如 telemetry toast 依赖 Vue 组件）才值得这样替换。

命名与放置规则：

- Vitest 逻辑测试用 `*.test.ts`，Playwright 旅程用 `*.spec.ts`。
- 将只有本领域使用的 fixture/helper 放在本领域的 `fixtures/` 或 `support/`，不为单次使用
  新建全局 helper。领域 fixture 与原始 API fixture 分开。
- 新测试不要放进生产目录；需要细分时在当前职责目录下建子目录，递归入口会自动发现。
- 测试直接导入生产模块；使用相对路径或项目已有别名，不复制实现。
- 页面截图、trace 和临时捕获放在忽略的产物目录，不当作维护中的测试源码。
- `pnpm typecheck` 包含四类逻辑测试；浏览器测试另运行 `pnpm typecheck:forum:ui`。
- 默认逻辑入口不启动浏览器；组件浏览器 harness 保留独立命令及其原有浏览器环境要求。

`test:theme:ui` 默认使用已安装的 Chrome，可通过原有 `SWIPE_BROWSER_CHANNEL` 与
`SWIPE_PLAYWRIGHT_PATH` 环境变量选择浏览器和安装位置；CI 的 Forum UI 工作流以
`SWIPE_BROWSER_CHANNEL=chromium` 复用它已安装的 Chromium。论坛 e2e 使用根包固定的
Playwright Chromium，安装与 Mock 规则见 `e2e/README.md`。
论坛 e2e 关闭调试工具，并使用独立 VitePress 缓存目录，避免与日常开发服务器的依赖预构建互相覆盖。

开发服务器的 Vite DevTools 中可打开 Vitest dock 并点击启动，在同一面板中操作测试界面。
Pinia Colada v2、Medula 和 UnoCSS Inspector 也在这个面板中；查看 Colada 缓存时使用站点内
嵌入的面板，单独打开的 DevTools 标签页无法连接另一个标签页的缓存。Colada 的 MCP 可通过
已有 Devframe 连接器调用，运行时操作需要浏览器页面保持打开。
设置 `VITE_COLADA_DEVTOOLS=false` 可关闭 Colada 调试插件，支持 shell 环境变量和根目录 `.env`。
如果当前环境设置了 `CI=true`，使用 `pnpm test:ui --watch` 让测试界面保持运行。

`pnpm build:analyze` 生成 Rolldown 分析记录和独立的静态分析产物，输出到
`.vitepress/cache/build-analysis/`。启动 `pnpm dev` 后在 Rolldown dock 查看构建记录；
普通 `pnpm build` 保持原有发布输出，不附带静态调试界面。分析产物不会进入 Git。
分析完成后自动清理旧 Rolldown session，仅保留最近两个（通常为一轮客户端与 SSR 构建）。
