import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const IMAGE_FILE_REGEX = /\.(?:png|jpg|jpeg|gif|webp)$/

const baseDir = fileURLToPath(new URL('../pages/public/emojis/', import.meta.url))
const outputFile = new URL('../data/static/common/emojis.gen.json', import.meta.url)

function getDirectories(source: string) {
  return fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
}

function getImagesFromFolder(folderPath: string, folderName: string) {
  console.log(`正在导入 [${folderName}] 表情包...`)
  const files = fs.readdirSync(folderPath)

  const imageList = files.filter(file => IMAGE_FILE_REGEX.test(file))
    .map((file) => {
      return {
        [path.parse(file).name.toLowerCase()]: path.posix.join(folderName, file),
      }
    })

  const configFile = JSON.parse(fs.readFileSync(path.join(folderPath, './config.json')).toString())

  console.log(`[${folderName}] 表情包导入成功（共导入 ${imageList.length} 个表情）`)
  return { presets: folderName.split('.')[1], list: imageList, logo: configFile.logo, width: configFile.width, height: configFile.height }
}

const emojis = getDirectories(baseDir)
  .sort((a, b) => Number(a.charAt(0)) - Number(b.charAt(0)))
  .map(folder => getImagesFromFolder(path.join(baseDir, folder), folder))
fs.writeFileSync(outputFile, JSON.stringify(emojis, null, 2), 'utf8')
