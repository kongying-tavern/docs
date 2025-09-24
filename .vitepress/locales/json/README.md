# 翻译文件说明

此目录包含从 TypeScript 文件提取的翻译数据：

- `zh.json` - 中文翻译
- `en.json` - 英文翻译
- `ja.json` - 日文翻译

每个 JSON 文件包含：
- 顶级配置项（title, description 等）
- themeConfig 中的所有配置
- constants 中的常量（META_URL, LOCAL_BASE 等）

## 重新生成

运行以下命令重新生成 JSON 文件：
```bash
pnpm run build-locales
```
