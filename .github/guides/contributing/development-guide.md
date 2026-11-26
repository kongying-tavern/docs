# 开发指南

这份指南面向参与仓库开发与维护的人。先读「代码放在哪」建立心智模型，再按手头的任务查对应章节。

各章只讲人的规范。AI 写作与检查约束见 [AGENTS.md](../../../AGENTS.md)，测试细节见 [测试目录说明](../../../tests/README.md)。

## 代码放在哪

VitePress 从 `pages/{en,zh,ja}` 读取本地化 Markdown 与路由定义，从 `pages/public` 复制静态资源，构建产物写入 `dist`。

| 目录 | 放什么 |
| --- | --- |
| `src/features` | 页面实现 |
| `src/components` | 可复用的 Vue 组件 |
| `src/forum` | 反馈论坛的 UI、composables、API providers、services 和 state |
| `src` 下对应目录 | 共享的 composables、services 和 utilities |
| `data/static` | 数据集，按 locale 分组 |
| `data/loader` | 内容加载器 |
| `.vitepress` | 站点外壳、主题与 VitePress 配置 |
| `scripts` | 工具脚本 |

`eslint.config.ts` 的导入规则保证论坛 services 与 API 代码不依赖 UI 层，并限制从 `src` 导入 `.vitepress` 时只能走批准的入口。

## 导入与路径

仓库按模块边界组织导入：跨模块边界用别名路径，同一个模块内用相对路径。目标目录存在 `index.ts` barrel 且导出了所需名字时，静态导入优先走 barrel；没有 barrel 或动态引入时，直接导入具体文件。所有内部导入都要写明完整扩展名。少数场景因为工具读路径的方式特殊，别名无法解析，只能用相对路径。

两条 ESLint 规则负责执行并自动重写：`local/prefer-barrel-import` 把可走 barrel 的静态导入改到目标目录的 `index.ts`，`local/native-import-path` 补全 specifier 的扩展名。`tests/runtime/shared/contracts/nativeConfig.test.ts` 验证配置图在纯 Node 下仍可加载。

- **模块边界**：`.vitepress/theme/components` 与 `.vitepress/theme/markdown-ext` 下每个功能目录都是一个边界。论坛 services 与 API 代码不依赖 UI 层，从 `src` 导入 `.vitepress` 只能走批准入口。
- **跨边界用别名**：从模块外静态导入时写别名路径，如 `@theme/...`。目标目录有 barrel 且导出了所需名字时走 `index.ts`；没有 barrel 时直接导入具体文件。
- **同模块内用相对**：同一目录内直接相对导入具体文件，不经过 barrel，避免 barrel 自环。
- **动态引入不走 barrel**：`import()`、`defineAsyncComponent` 等动态加载直接指向具体文件，如 `import('./Foo.vue')`。`prefer-barrel-import` 只检查静态 import 声明，动态引入仍需写明扩展名。
- **扩展名不能省**：内部导入一律写明最终文件，如 `./foo.ts`、`./foo/index.ts`、`./Foo.vue`；走 barrel 也要写到 `index.ts`，不能停在目录名。原生 Node ESM 不做扩展名补全或裸目录解析。
- **别名声明**：只在 `.vitepress/config/aliases.ts` 声明，`tsconfig.json` 镜像该表，别名测试在两者漂移时失败。`#data` 指向 `data/`。
- **只能用相对路径的场景**：以下位置由工具直接读取路径，别名无法解析。
  - 站点配置链（`.vitepress/config.ts` → `.vitepress/config/markdown.ts` → `.vitepress/theme/markdown-ext`）由原生 Node 求值，不解析 `@theme`，所以 `.vitepress/theme` 内用相对路径。
  - `pages/` 下 Markdown 的 `<style src>` 由链接检查器解析，要相对该文件写，如 `../../src/features/links/Join.css`。
  - `.vitepress/theme/components/ui/mdc.ts` 被元数据插件按文本读取，其中的 `.vue` 再导出不进 Node 图；新增 MDC tag 要在这个文件加导出，不加到 barrel。

## Node 脚本约束

`package.json` 里以 `node *.ts` 运行的脚本，其入口及全部导入必须保持类型可擦除。原因是 node 只剥离类型，不做转译。

- 不用 `enum`、`namespace`、参数属性、decorator 或 `import =`。
- 不使用 tsconfig 别名；相对路径、裸包和 `#` 导入除外。
- `.json` 导入必须带 `with { type: 'json' }`。
- 不使用 CommonJS 全局（`require`、`module`、`exports`、`__dirname`、`__filename`）——`tsc` 通过 `@types/node` 接受它们，`node` 在加载时才失败。
- Node 版本需为 22.18+（22 线）或 23.6+（更新线），这是两条线上首次无需 flag 即可运行类型剥离的版本。

`pnpm typecheck:node` 检查这些约束，并自动纳入 `package.json` 中新增的入口。

## Markdown 扩展注册

`markdown-ext` 下每个扩展，无论提供 `::: name` 块、行内规则还是纯 MDC 组件（如 `Card`、`QA`），都必须在 `comark/comarkPatches.ts` 的 `RESERVED_BLOCK_CONTAINERS` 注册小写名。

原因是 Comark 在 `preConfig` 注册，其块规则匹配任意 `::: name`；没有注册项时，名字会被当作 MDC 组件捕获并被 Vue 编译器丢弃。`demo` 完全依赖这份列表，注册顺序不能替代它。

- 查找只对块规则生效，且大小写敏感：小写注册项拦截 `:::name` / `::name` 块，PascalCase 标签（`::Card`、`::Spoiler`、`::QA`）照常渲染。扩展的块形式用大写标签书写；行内形式 `:name[...]` 不查这份列表。
- MDC 组件名按组件文档给出的大小写写，如 `::Card`、`:Spoiler[...]`。
- 扩展存在期间一直保留注册项；扩展改变提供的 Markdown 语法时也不要删除。

## 常用命令

首次使用前运行 `corepack enable && pnpm install`。

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 本地启动 VitePress |
| `pnpm build`（别名 `pnpm build-vitepress`） | 生成静态文档，服务路径为 `/docs/` |
| `pnpm build:fonts` | 校验或重新生成缓存的字体子集；构建时自动运行 |
| `pnpm build-data` | 更新 member 或 blog 数据；串行执行 `use-data-env`、`build-member`、`pnpm lint`、`pnpm typecheck` |
| `pnpm typecheck` | 串行执行 `typecheck:ts`、`typecheck:node`、`typecheck:vue` |
| `pnpm lint` | ESLint 与中文排版 `pnpm lint:zh` |
| `pnpm lint:md` | Markdown 结构检查，由独立 CI step 与 autofix.ci 运行 |

## 检查范围

按改动类型选择检查，而不是一律跑 `pnpm lint`。各命令的覆盖范围：

- `pnpm lint:md` 扫描 `**/*.md` 减去 `.markdownlintignore`，覆盖 `pages/` 之外的 Markdown；Markdown-only 改动跑它就够。
- `pnpm lint:zh` 只覆盖 `pages/zh/**/*.md`，不检查 `.github/` 或根目录的中文文本，英文与日文页面无排版检查。
- `pnpm lint:eslint`（`eslint --cache .`）覆盖 TS/JS/Vue/JSON/YAML/CSS，但忽略 `**/*.md`，不能替代 `lint:md`；修复用 `pnpm lint:eslint:fix`。
- `pnpm typecheck:ts` 覆盖 config、`.vitepress`、`scripts`、`src`、`pages`、`tests/runtime`、`tests/harness`，不含 Markdown。
- `pnpm typecheck:node` 检查 `package.json` 中每个 `node *.ts` 入口的类型可擦除、别名、decorator、JSON import attributes 与 ESM/CJS 全局。
- `pnpm typecheck:vue` 走 `tsconfig.vue.json`，检查 Vue 侧，不含 Markdown。
- `pnpm typecheck:forum:ui` 覆盖 `tests/e2e/**`，用独立 tsconfig，不在 `pnpm typecheck` 内。

两点容易踩空：`pnpm lint` 不含 `pnpm lint:md`；提交钩子只对本暂存的 JS/TS/Vue/CSS 跑 `eslint --fix`，不跑 Markdown 检查和类型检查。

`scripts/lintMd.ts` 把从 `.markdownlintignore` 派生的文件列表交给 mdclint，mdclint 自己不读 ignore 文件，因此那个文件是唯一的 ignore 来源。不要给 `.markdownlint.json` 加 `"default": true`，mdclint 会把它当成另一个配置文件并静默丢弃所有规则覆盖。

## 字体流水线

字体子集由 Vite 插件在 dev/build 启动时自动生成，新 clone 不需要手动步骤，只需备好 Python 工具链。

- 站点字符只影响 `fonts-subset.gen.css` 的 `cjk.min` 层；script tiers（`latin`、`latin-ext`、`symbols`、`kana`、`cjk-punct`）与固定的 Google Fonts buckets 保持稳定。
- 生成的分块命名为 `{stem}.{group}.{NN}.{hash}.gen.woff2`，如 `hywenhei_45w.cjk.l1.01.<hash>.gen.woff2`。`*.gen.woff2` 与两个样式表全部 gitignore，从源 TTF 确定性重建。
- 配置在 `scripts/fonts/font-subset.config.json`，其中 `scripts` 段的 latin/latin-ext 范围镜像 VitePress 的 `fontSubsets.json`；标准字符与切片桶在它引用的 `font-characters.config.json` 和 `font-slicing.config.json`。
- 需要 Python 3 加 fonttools 与 brotli（`pip install -r requirements.txt`），工具链缺失时构建停止。

## 代码风格与命名

- `.editorconfig` 强制 2 空格缩进与 LF 结尾；ESLint 规则在 `eslint.config.ts`，样式沿用 UnoCSS utilities 与现有组件目录。
- Vue SFC 用 PascalCase（如 `TeamCard.vue`），composables 用 `useX`，stores 用 `useXStore`，locale Markdown 文件名用 kebab-case。
- 组件本地常量放在读取它的 SFC 旁边：`styles.ts` 放 class/style token，`constants.ts` 放固定表（storage keys、selectors、timings），`config.ts` 放组件读取的配置（prop 默认值、尺寸映射）。
- 提交前用 `pnpm lint:eslint:fix` 与 `pnpm lint:md:fix` 处理风格漂移。

提交格式、scope 与 PR 要求见 [提交约定](commit-convention.md)，翻译流程见 [翻译指南](../translation/translation-guide.md)。
