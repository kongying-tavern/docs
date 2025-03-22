import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const baseDir = path.join(filename, '../../src/public/emojis')
const dataDir = path.join(filename, '../../src/_data')

function getDirectories(source: string) {
  return fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
}

function getImagesFromFolder(folderPath: string, folderName: string) {
  console.log(`正在导入 [${folderName}] 表情包...`)
  const files = fs.readdirSync(folderPath)

  const imageList = files.filter(file => /\.(?:png|jpg|jpeg|gif|webp)$/.test(file))
    .map((file) => {
      const emojiPath = `/${path.posix.join(folderName, file)}`

      return {
        [path.parse(file).name.toLowerCase()]: emojiPath.slice(1),
      }
    })

  const configFile = JSON.parse(fs.readFileSync(path.join(folderPath, './config.json')).toString())

  console.log(`[${folderName}] 表情包导入成功（共导入 ${imageList.length} 个表情）`)
  return { presets: folderName.split('.')[1], list: imageList, logo: configFile.logo, width: configFile.width, height: configFile.height }
}

function generateEmojiData(baseDir: string) {
  if (!fs.existsSync(baseDir)) {
    console.error(`Directory not found: ${baseDir}`)
    return []
  }
  const folders = getDirectories(baseDir)
  console.log(folders)
  return folders.sort((a, b) => Number(a.charAt(0)) - Number(b.charAt(0))).map(folder => getImagesFromFolder(path.join(baseDir, folder), folder))
}

export function emojiLoader() {
  const emojis = generateEmojiData(baseDir)

  try {
    fs.writeFileSync(path.join(dataDir, 'emojis.json'), JSON.stringify(emojis, null, 2), 'utf-8')
  }
  catch (error) {
    console.error('Emojis data file could not be saved', error)
  }

  return Object.assign({}, ...emojis.map(emoji => ({
    [`emoji-${emoji.presets}`]: emoji.list,
  })))
}

emojiLoader()
export default emojiLoader
