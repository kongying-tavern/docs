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
| `pnpm test:forum` | forum |
| `pnpm test:shared` | shared |
| `pnpm test:theme` | shared + theme，保留主题原有网站设置检查 |
| `pnpm test:fonts` | fonts |
| `pnpm test:forum:ui` | e2e 的 `*.spec.ts`，自动启动 VitePress |
| `pnpm test:theme:ui` | swipe-actions 的 `browser.test.mjs`，自动启动组件测试服务 |

逻辑测试由 `scripts/runTests.mjs` 使用 Node 原生目录枚举递归发现，再交给 Node/tsx 执行。
不依赖 Windows shell 的递归 glob 展开；每个请求的分类没有测试时直接失败，避免空跑成功。
可以用 `node scripts/runTests.mjs forum --list` 查看单个分类的发现结果。

命名与放置规则：

- Node/tsx 逻辑测试用 `*.test.ts`，Playwright 旅程用 `*.spec.ts`。
- 将只有本领域使用的 fixture/helper 放在本领域的 `fixtures/` 或 `support/`，不为单次使用
  新建全局 helper。领域 fixture 与原始 API fixture 分开。
- 新测试不要放进生产目录；需要细分时在当前职责目录下建子目录，递归入口会自动发现。
- 测试直接导入生产模块；使用相对路径或项目已有别名，不复制实现。
- 页面截图、trace 和临时捕获放在忽略的产物目录，不当作维护中的测试源码。
- `pnpm typecheck` 包含四类逻辑测试；浏览器测试另运行 `pnpm typecheck:forum:ui`。
- 默认逻辑入口不启动浏览器；组件浏览器 harness 保留独立命令及其原有浏览器环境要求。

`test:theme:ui` 默认使用已安装的 Chrome，可通过原有 `SWIPE_BROWSER_CHANNEL` 与
`SWIPE_PLAYWRIGHT_PATH` 环境变量选择浏览器和安装位置。论坛 e2e 使用根包固定的 Playwright
Chromium，安装与 Mock 规则见 `e2e/README.md`。
