# 测试目录与运行规则

维护中的测试统一放在根目录 `tests/`，生产实现仍留在 `src/`、`.vitepress/` 和 `scripts/`。
顶层按运行方式分为 Vitest、Playwright 和组件浏览器 harness 三类；每类内部按领域与功能模块
分层。文件位置不代表只能写纯单元测试，`runtime/` 里同样有查询、HTTP 与事务集成测试。

```text
tests/
  support/                  跨运行方式共享的 helper，不依赖任何运行器
  fixtures/                 跨套件复用的纯数据 fixture，用生产 parser 校验
  runtime/                  Vitest，Node 环境
    forum/                  论坛：api、auth、comments、content、images、layout、personal-state、
                            publish、queries、routing、search、topics
    theme/                  主题：blog、config、fluid-hover、i18n、keyboard-shortcut、layout、
                            markdown、router、swipe-actions、unocss
    shared/                 站点共享：content、contracts、site、telemetry
    fonts/                  字体流水线：build、cache、config、pipeline（support/ 是 Python 脚本）
  e2e/                      Playwright，浏览器旅程
    forum/                  论坛：api、auth、boot、comments、images、layout、personal-state、
                            routing、search、topics
    site/                   站点：boot、docs、i18n、layout、settings
    support/                Mock 请求处理器和 Playwright fixture
  harness/                  组件浏览器 harness，node --test
    theme/                  keyboard-shortcut、swipe-actions
```

顶层项目内部至少一层子目录。领域下再按功能模块分，模块内放测试文件；模块没有内容时
不要保留空目录。运行器专属的基座（`e2e/support/`、harness 的 `fixtures/` 页面、fonts 的
Python 脚本）留在对应运行方式目录内，不上移。

| 命令 | 发现范围 |
| --- | --- |
| `pnpm test` | `tests/runtime` 下所有 `*.test.ts` |
| `pnpm test:list` | 列出上述完整文件清单，不执行 |
| `pnpm test:watch` | 持续监听 runtime 套件，修改后重跑受影响的测试 |
| `pnpm test:ui` | 启动 Vitest 界面，查看结果、筛选和重跑测试 |
| `pnpm test:coverage` | 运行 runtime 套件并生成 `coverage/` 覆盖率报告 |
| `pnpm test:runtime` | runtime 全部领域 |
| `pnpm test:forum` | runtime/forum |
| `pnpm test:shared` | runtime/shared |
| `pnpm test:theme` | runtime/shared + runtime/theme，保留主题原有网站设置检查 |
| `pnpm test:fonts` | runtime/fonts |
| `pnpm test:forum:ui` | `tests/e2e` 下 forum 与 site 的 `*.spec.ts`，自动启动 VitePress |
| `pnpm test:forum:ui:list` | 列出 e2e 用例，不启动浏览器 |
| `pnpm test:forum:ui:build` | 构建独立的 `/docs/` 浏览器测试产物 |
| `pnpm test:forum:ui:production` | 构建产物上的用户流程、hydration 与 chunk 检查 |
| `pnpm test:forum:ui:source` | `@source` 源码专项，自动启动开发服务器 |
| `pnpm test:theme:ui` | harness/theme 下 keyboard-shortcut 与 swipe-actions 的 `browser.test.mjs` |

逻辑测试由 `vitest.config.ts` 统一发现并在 Node 环境执行，不依赖 Windows shell 展开 glob。
测试配置独立于站点 Vite 配置，避免运行逻辑测试时启动字体构建或页面调试插件。
文件保持隔离，mock、环境变量和 stub 全局对象在每条测试后自动恢复；使用假定时器的测试
还应在清理钩子中调用 `vi.useRealTimers()`。空测试集和 CI 中的 `test.only` 会导致失败。
可以用 `pnpm exec vitest list tests/runtime/forum --filesOnly` 查看单个领域的发现结果，
或用 `pnpm test:watch tests/runtime/forum -t "关键词"` 监听指定范围。
现有 `node:assert/strict` 断言继续使用，测试注册、清理、spy 和假定时器改用 Vitest API。

覆盖率显式统计论坛 API（含 provider 适配层）、composable、认证、路由、服务、
store 和工具，以及共享逻辑、主题 hooks 与字体流水线；未被导入的文件也纳入统计，
Vue 页面与组件不属于这个逻辑指标。
CI 运行完整覆盖率测试并上传 HTML 报告。全局门槛基于当前范围的基线，认证刷新模块另有
行覆盖率 65%、分支覆盖率 60% 的门槛；新增统计范围时应重新评估基线。
shared 套件还通过独立 Node 进程实际验证两份站点配置和三个内容数据加载器的原生加载，检查完整运行时导入链的兼容性。
`runtime/fonts` 中依赖 Python 的两项流水线检查在缺少 fontTools/brotli 时标记为 skipped
并保持套件通过，安装了工具链的 CI 仍会真实执行；本地无 Python 时不要把它们当作通过。
测试里的生产模块 mock 必须是边界替身，不要用 `readFileSync` + `node:vm` 之类的方式加载
生产源码：那样会绕开 Vite 别名、丢掉覆盖率归因，并把"依赖清单"变成脆弱的隐式契约。
确实无法在 Node 环境加载的模块（例如 telemetry toast 依赖 Vue 组件）才值得这样替换。

命名与放置规则：

- Vitest 逻辑测试用 `*.test.ts`，Playwright 旅程用 `*.spec.ts`，组件 harness 用 `browser.test.mjs`。
- 新测试先找所属领域与功能模块；模块内直接放文件，不再为单个文件新开子目录。
- 跨运行方式共用的 helper 放 `tests/support/`（不依赖任何运行器）；跨套件复用的纯数据
  fixture 放 `tests/fixtures/`（用生产 parser 校验，如原始 Gitee 对象）。运行器专属的
  基座和探针留在该运行方式目录下，不为单次使用新建全局 helper。
- 新测试不要放进生产目录；确实需要跨领域的浏览器 fixture 才放 `tests/e2e/support/`。
- 测试导入生产模块一律用相对路径，不依赖别名解析；优先指向定义文件，纯 re-export 的
  `index.ts` 只在它不携带 UI 或其它副作用时使用。barrel 引入 SFC 会让 Playwright 无法加载
  用例，这类副作用应拆到独立模块（见 `services/telemetry` 的 `toast.ts`）。
- 页面截图、trace 和临时捕获放在忽略的产物目录，不当作维护中的测试源码。
- 各 typecheck 命令的覆盖范围见[开发指南的检查范围](../.github/guides/contributing/development-guide.md#检查范围)。
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
