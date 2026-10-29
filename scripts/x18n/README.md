# i18n 开发说明

界面文案使用 [vue-i18n](https://vue-i18n.intlify.dev/)，[x18n](https://github.com/x18n-dev/x18n) 负责编辑与检查。翻译文件的位置、认领和提交步骤见[翻译指南](../../.github/translation-guide.md)。

本页供开发者查阅命令和代码用法。Agent 执行翻译任务前，先读 [Agent 工作流](../../.agents/i18n.md)。

## 命令说明

以下命令在仓库根目录运行，定义见 [package.json](../../package.json)。`i18n:*` 都调用 x18n CLI，共用 [x18n.config.ts](../../x18n.config.ts)。

| 命令 | 用途 | 读写范围 |
| --- | --- | --- |
| `pnpm i18n <子命令>` | x18n CLI 入口，用于查询或修改词条 | 由子命令决定；`get`、`usages` 用于查询，`set`、`rename` 等会修改源文件 |
| `pnpm i18n:check` | 本地或 CI 检查缺译、占位符等问题 | 读取词条、代码引用和可用的 Git 历史，输出诊断，不修改译文；有错误时返回非零退出码 |
| `pnpm i18n:ui` | 启动本地词条编辑器 | 使用终端给出的认证链接访问；保存时写回 YAML，包括 `site.yml`。按 `Ctrl+C` 停止 |
| `pnpm i18n:build` | 生成只读界面词条看板 | 扫描当前项目，将页面和检查结果写入 `dist/_i18n/`，不修改词条 |
| `pnpm translations:build` | 生成两个翻译看板 | 先运行 `lunaria:build`，成功后再运行 `i18n:build`；输出 `dist/_translations/` 和 `dist/_i18n/` |

新增语言另用 `pnpm init:locale`，步骤见[新增语言](../../.github/trans-guide-new-language.md)。

### 工作原理

1. **读取资源**：从语言目录确定语言列表，用原生路径规则读取全部 YAML，文件名作为命名空间。
2. **分析引用**：官方 `vue-i18n` preset 扫描 `src/` 和 `.vitepress/theme/` 下 TS、Vue 文件中的静态翻译调用。检查同时使用各语言词条和这些引用；动态 key 仍需人工核对。
3. **输出结果**：`check` 输出诊断，`ui` 提供本地编辑界面，`build` 把结果保存为可部署的静态看板。它们使用同一套资源与检查规则。

这些命令负责站点内置文案。Markdown 文章由 Lunaria 追踪；站点页面和消息的编译由 `pnpm dev`、`pnpm build` 完成，见[资源加载](#资源加载)。

## 资源加载

文件名就是命名空间，例如 `docReaction.yml` 中的 `title` 对应 `docReaction.title`。新增词条优先复用已有命名空间；新增文件时，在源语言和目标语言目录中使用相同文件名，无需另行注册。

界面 YAML 由官方 `@intlify/unplugin-vue-i18n` 预编译。`site.yml` 由同目录的 `config.ts` 加载，不参与消息编译；修改后 VitePress 会重载配置。公共地址和分类 ID 放在 [common.ts](../../.vitepress/locales/common.ts)，标题匹配字符串在加载时转为正则。

x18n 0.1.1 的 YAML 解析器缺少数组支持，项目通过 [pnpm 补丁](../../patches/@x18n__builtins@0.1.1.patch)补齐读取和编辑，安装依赖时自动应用。升级 x18n 后先验证原生数组支持，再移除补丁。

补丁暂时阻止含数组的命名空间被整文件重写，包括 `format`、启用排序后的写入和创建语言文件，避免数组变成数字键对象。已有文件的逐项编辑可正常使用；新增语言用 `pnpm init:locale` 复制完整结构。

语言列表来自语言目录，源语言使用 `DEFAULT_LOCALE`，当前语言跟随 VitePress 的 `localeIndex`。每个 Vue 应用各自创建 i18n 实例。

## 组件用法

```ts
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
const count = ref(0)
const label = computed(() => t('forum.sidebar.totalComments', { count: count.value }))
```

- 参数使用 `{name}`。复数词条使用 `单数 | 复数`，`count` 保持数字类型。
- 链接、按钮等交互内容使用 `I18nT` 具名插槽；字面量 `@` 写作 `{'@'}`。
- 需要随语言变化的文案放入 `computed`，避免在初始化时保存译文快照。
- 业务函数通过格式化回调输出句子，由组件选择翻译 key。
- 日期显示复用 `Time` 组件或 `d()`；相对时间使用原生 `Intl.RelativeTimeFormat`。`Time` 先渲染 UTC 绝对时间，挂载后再显示本地或相对时间。

vue-i18n 提供 API 类型，x18n 提供项目 key 的补全、跳转和缺译检查。VS Code 扩展见[工作区推荐](../../.vscode/extensions.json)。

## 查询与检查

```sh
pnpm i18n --help
pnpm i18n get forum.loadMore
pnpm i18n usages forum.loadMore
```

用 `get` 查看一个 key 的各语言文案，用 `usages` 定位使用位置。翻译检查命令见[提交前检查](../../.github/translation-guide.md#checks-and-submission)。

`site.yml` 使用原始 YAML 路径，例如 `site.themeConfig.nav.0.text`。链接和匹配规则等字段也会显示，可在 x18n 中编辑；数组按下标对应，不自动匹配菜单含义。调整菜单结构时核对各语言的对应项。

静态扫描可能漏掉动态 key 和传给其他函数的 `t()`，因此关闭 `unused-key`；删除词条前先检查引用。原生 `identical-to-source` 将与源文相同的值列为信息提示，由人工判断是否需要翻译。规则和术语表引用见 [x18n.config.ts](../../x18n.config.ts)。

修改接入代码后运行 `pnpm typecheck` 和 `pnpm test:theme`；涉及字体提取时再运行 `pnpm test:fonts`。YAML 新增字符会更新站点字体缓存。`pnpm lint:zh` 检查中文 Markdown 排版，YAML 格式由 ESLint 检查。修改 x18n 配置或补丁后，重启 `pnpm i18n:ui`。

## 发布看板

部署时先运行 `pnpm build`，再运行 `pnpm translations:build`。两个看板随站点发布到 `/docs/_translations/` 和 `/docs/_i18n/`，显示构建时的检查结果；文章认领机器人读取 Lunaria 的 `status.json`。

CI 执行 `pnpm i18n:check`，错误会阻断构建，警告需要人工复核。移动或重命名文件后，结合源文和词条引用复核历史提示。

## 官方参考

[消息语法](https://vue-i18n.intlify.dev/guide/essentials/syntax) · [类型支持](https://vue-i18n.intlify.dev/guide/advanced/typescript) · [x18n 配置](https://github.com/x18n-dev/x18n/blob/main/docs/content/6.references/1.config.md)
