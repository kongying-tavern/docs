import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Matches path separators (forward slash or backslash) */
const PATH_SEPARATOR_REGEX = /[/\\]/

/** Matches backslash in file paths */
const BACKSLASH_REGEX = /\\/g

const _filename = fileURLToPath(import.meta.url)
const _dirname = dirname(_filename)

// 动态导入函数
async function importLocaleConfig(locale: string) {
  try {
    const module = await import(`../.vitepress/locales/${locale}/index.js`)
    return module[`${locale}Config`] || module.default
  }
  catch (error) {
    console.error(`Failed to import ${locale} config:`, error)
    return null
  }
}

// 递归读取目录中的 TypeScript 文件
function readTSFiles(dir: string): string[] {
  const files: string[] = []

  try {
    const items = readdirSync(dir)

    for (const item of items) {
      const itemPath = join(dir, item)
      const stat = statSync(itemPath)

      if (stat.isDirectory()) {
        files.push(...readTSFiles(itemPath))
      }
      else if (item.endsWith('.ts') && item !== 'index.ts' && item !== 'types.ts') {
        files.push(itemPath)
      }
    }
  }
  catch (error) {
    console.warn(`Could not read directory ${dir}:`, error)
  }

  return files
}

// 提取单个 TypeScript 文件的内容
async function extractTSFileContent(filePath: string) {
  try {
    // Convert Windows path to file URL for dynamic import
    const fileUrl = new URL(`file:///${filePath.replace(BACKSLASH_REGEX, '/')}`).href
    const module = await import(fileUrl)
    return module.default || module
  }
  catch (error) {
    console.warn(`Could not import ${filePath}:`, error)
    return null
  }
}

// 从文件路径提取文件名（不含扩展名）
function getFileName(filePath: string): string {
  return filePath.split(PATH_SEPARATOR_REGEX).pop()?.replace('.ts', '') || ''
}

async function main() {
  const locales = ['zh', 'en', 'ja']
  const outputDir = resolve(_dirname, '../.vitepress/locales/json')

  // 确保输出目录存在
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  for (const locale of locales) {
    try {
      console.log(`🔄 处理 ${locale} 语言...`)

      const localeDir = resolve(_dirname, `../.vitepress/locales/${locale}`)
      const tsFiles = readTSFiles(localeDir)

      const localeData: Record<string, unknown> = {}

      // 读取每个 TypeScript 文件的内容
      for (const filePath of tsFiles) {
        const fileName = getFileName(filePath)
        const content = await extractTSFileContent(filePath)

        if (content) {
          localeData[fileName] = content
          console.log(`   ✓ ${fileName}.ts`)
        }
      }

      // 获取顶级配置
      const config = await importLocaleConfig(locale)
      if (config) {
        // 合并顶级配置和各个文件的内容
        const { themeConfig, ...topLevel } = config

        // 将 constants 内容提升到顶层
        const constants = (localeData.constants as Record<string, unknown>) || {}

        const mergedData = {
          ...topLevel,
          ...themeConfig,
          ...constants, // 将 constants 内容直接合并到顶层
        }

        // 写入 JSON 文件
        const outputPath = resolve(outputDir, `${locale}.json`)
        writeFileSync(outputPath, JSON.stringify(mergedData, (_key, value) => {
          // Convert RegExp objects to string representation
          if (value instanceof RegExp) {
            return {
              __regex__: value.source,
              __flags__: value.flags,
            }
          }
          return value
        }, 2))

        console.log(`   💾 已保存到 ${locale}.json`)
      }
    }
    catch (error) {
      console.error(`❌ 处理 ${locale} 失败:`, error)
    }
  }

  console.log('✅ 翻译文件合并完成！')
  console.log('📁 输出目录:', outputDir)

  // 生成使用说明
  const readmeContent = `# 翻译文件说明

此目录包含从 TypeScript 文件提取的翻译数据：

- \`zh.json\` - 中文翻译
- \`en.json\` - 英文翻译
- \`ja.json\` - 日文翻译

每个 JSON 文件包含：
- 顶级配置项（title, description 等）
- themeConfig 中的所有配置
- constants 中的常量（META_URL, LOCAL_BASE 等）

## 重新生成

运行以下命令重新生成 JSON 文件：
\`\`\`bash
pnpm run build-locales
\`\`\`
`

  writeFileSync(resolve(outputDir, 'README.md'), readmeContent)
}

main().catch(console.error)
