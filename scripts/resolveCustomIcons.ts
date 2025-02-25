import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'

interface IconData {
  [key: string]: string
}

export function resolveCustomIcons(): IconData {
  const svgDir = path.resolve(
    fileURLToPath(new URL('../src/public/imgs/common/svg', import.meta.url)),
  )
  const data: IconData = {}

  // Ensure the directory exists before reading
  if (!fs.existsSync(svgDir)) {
    throw new Error(`Directory not found: ${svgDir}`)
  }

  const svgFiles = fs
    .readdirSync(svgDir)
    .filter(file => file.endsWith('.svg'))

  svgFiles.forEach((file) => {
    const fileNameWithoutExt = path.basename(file, '.svg')
    const filePath = path.join(svgDir, file)

    data[fileNameWithoutExt] = fs.readFileSync(filePath, 'utf8')
  })

  return data
}
