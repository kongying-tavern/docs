import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PAGES_DIR } from '../.vitepress/config/pagesDir.ts'

interface IconData {
  [key: string]: string
}

// 资源目录按模块位置定位，不跟随调用方的 cwd。
const svgDir = fileURLToPath(new URL(`../${PAGES_DIR}/public/imgs/common/svg`, import.meta.url))

export function resolveCustomIcons(): IconData {
  const data: IconData = {}

  // Ensure the directory exists before reading
  if (!fs.existsSync(svgDir)) {
    throw new Error(`Directory not found: ${svgDir}`)
  }

  const svgFiles = fs
    .readdirSync(svgDir)
    .filter(file => file.endsWith('.svg'))

  svgFiles.forEach((file) => {
    // basename 去除任何目录成分，确保只读取目标目录内的文件
    const fileNameWithoutExt = path.basename(file, '.svg')
    const filePath = path.join(svgDir, path.basename(file))

    data[fileNameWithoutExt] = fs.readFileSync(filePath, 'utf8')
  })

  return data
}
