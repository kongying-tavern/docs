# ESLint 配置与维护

项目使用 ESLint flat config，入口为 `eslint.config.ts`，基础规则来自
`@antfu/eslint-config`。版本统一放在 `pnpm-workspace.yaml`，锁文件固定实际安装版本。
`jiti` 是显式开发依赖，用于 Node 加载 TypeScript 配置，不依赖其他包间接提供。

## 检查范围

| 文件 | 检查方式 |
| --- | --- |
| JS、TS、Vue，以及 `.vitepress`、scripts、tests 中的源码 | antfu 默认规则与项目覆盖 |
| JSON、JSONC、JSON5 配置 | 语法、重复键、格式；package.json 和 tsconfig 额外检查顺序 |
| `src/**/*.json`、`tests/**/fixtures/**/*.json` | 正确性检查，格式由数据生成器或夹具维护者负责 |
| YAML、GitHub Actions、pnpm workspace | YAML 规则；workspace 额外检查 catalog 和安装设置 |
| CSS、SCSS | `format/prettier` 格式检查；这不等同于 CSS 语义检查 |
| Markdown、VitePress MDC | 独立使用 `pnpm lint:md`、`pnpm lint:zh` |

ESLint 继承 `.gitignore` 与 antfu 默认忽略项。public、构建产物、缓存、字体生成文件、
组件元数据与本地历史 codemod 不进入检查。维护中的测试与源码一起检查。

## 项目覆盖

- 未使用变量由 `unused-imports/no-unused-vars` 报告一次，级别为 warning。
  `_` 开头的参数、变量和解构占位符可有意不使用；未使用导入仍为 error。
- Node 逻辑测试允许 `node:test`，仍禁止提交 `test.only`。
  Playwright 的 `*.spec.ts` 保留基础测试规则。
- `src` 不允许通过相对路径导入 `.vitepress`，既有类型出口
  `src/forum/types.ts` 与 `src/composables/usePostData.ts` 保留例外。
- 论坛 services/api 不允许从 components/composables 向上导入，包含类型导入、
  `~/forum/` 别名和常见相对路径。两条边界必须在重叠文件中同时生效。
- TypeScript 类型感知规则尚未开启；`typescript: true` 提供语法规则，
  类型检查由 `pnpm typecheck` 负责。启用类型感知规则需要另行评估项目范围与性能。

## pnpm 策略

依赖使用 catalog；未使用或重复的 catalog 条目会报错。
采用 antfu 要求的 `minimumReleaseAgeExcludePrune`、`shellEmulator` 和
`trustPolicy: no-downgrade`。现有 VitePress 依赖链中的三个固定版本已确认需要精确例外：
`chokidar@4.0.3`、`semver@6.3.1`、`vite@5.4.21`。
后续升级这些依赖时重新核对例外，不扩大为整个包的豁免。

## 常用操作

```sh
pnpm lint:eslint
pnpm lint:eslint:fix
pnpm exec eslint --print-config src/forum/services/form/imageAttachment.ts
node --import tsx --test tests/shared/eslintConfig.test.ts
pnpm typecheck
```

VS Code 的 `eslint.validate` 与提交前的 lint-staged 覆盖相同语言。
提交前会忽略显式传入的生成文件，不因 ignored-file 提示造成噪声。
CI 的 CHECK 与 autofix 路径过滤器包含配置文件和工作流变更。

升级时先保存未升级的全量检查结果，再对比新规则。antfu 的小版本也可能调整默认规则，
不能仅凭版本号认为检查行为不变。配置回归测试会实际调用 ESLint，验证覆盖、忽略项、
边界规则、未使用变量、数据 JSON 与 Node 测试约束。

参考：

- [ESLint 配置文档](https://eslint.org/docs/latest/use/configure/configuration-files)
- [ESLint 10 迁移说明](https://eslint.org/docs/latest/use/migrate-to-10.0.0)
- [antfu 配置文档](https://github.com/antfu/eslint-config#customization)
- [antfu 发布记录](https://github.com/antfu/eslint-config/releases)
- [pnpm 安装策略](https://pnpm.io/settings#trustpolicy)
