import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

interface IconData {
  [key: string]: string
}

export function resolveCustomIcons(): IconData {
  // 以仓库根（进程工作目录）定位资源目录；脚本运行于仓库根，无需相对路径回溯
  const svgDir = path.resolve(process.cwd(), 'src/public/imgs/common/svg')
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
