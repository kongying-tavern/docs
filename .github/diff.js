const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const core = require('@actions/core')

function init() {
  const DEPLOY_DOMAIN =
    process.env.DEPLOY_DOMAIN | 'https://yuanshen.site/docs/'
  const OUT_DIR = process.env.OUT_DIR | 'dist'
  let result = ''
  let outRange = false

  function calculateHashForHTMLFiles(directoryPath) {
    const files = fs.readdirSync(core.toPlatformPath(directoryPath))
    const result = {}

    files.forEach((file) => {
      const filePath = path.join(directoryPath, file)
      const fileStats = fs.statSync(filePath)

      if (fileStats.isFile() && file.endsWith('.html')) {
        const fileContent = fs.readFileSync(filePath, 'utf8')
        const hash = crypto.createHash('md5').update(fileContent).digest('hex')

        result[filePath.substring(filePath.indexOf('\\') + 1)] = hash
      } else if (fileStats.isDirectory()) {
        const subDirectoryPath = path.join(directoryPath, file)
        const subDirectoryFiles = calculateHashForHTMLFiles(subDirectoryPath) // 递归调用遍历子目录

        Object.assign(result, subDirectoryFiles) // 合并子目录的结果到当前对象
      }
    })

    return result // 返回结果对象
  }

  function compareFilesWithHash(previousFiles, currentFiles) {
    console.log(previousFiles, currentFiles)
    const changedFiles = Object.keys(currentFiles).filter((key) => {
      return (
        previousFiles.hasOwnProperty(key) &&
        previousFiles[key] !== currentFiles[key]
      )
    })

    const newFiles = Object.keys(currentFiles).filter((key) => {
      return !previousFiles.hasOwnProperty(key)
    })

    return {
      changedFiles,
      newFiles,
    }
  }

  function exportHTML(data, maxCount = 10) {
    let str = ''

    console.log(data.length)
    if (data.length >= maxCount) outRange = true
    data.forEach((val, count) => {
      if (count >= maxCount) return
      str += `<li>${core.toPosixPath(val)}<a href="${
        DEPLOY_DOMAIN + core.toPosixPath(val)
      }" rel="nofollow">view</a></li>`
    })

    return str
  }

  const { changedFiles, newFiles } = compareFilesWithHash(
    calculateHashForHTMLFiles(OUT_DIR == 0 ? 'dist' : OUT_DIR),
    calculateHashForHTMLFiles('_site')
  )

  if (changedFiles.length === 0 && newFiles.length === 0) {
    core.info('No new or changed files')

    return ''
  }

  if (changedFiles.length !== 0 && newFiles.length === 0) {
    result = `
      <p dir="auto">Changed pages include:</p>
      <ul dir="auto">
      ${exportHTML(changedFiles)}
      </ul>`
  } else if (changedFiles.length === 0 && newFiles.length !== 0) {
    result = `
      <p dir="auto">New pages include:</p>
      <ul dir="auto">
      ${exportHTML(newFiles)}
      </ul>`
  } else {
    result = `
      <p dir="auto">Changed pages include:</p>
      <ul dir="auto">
      ${exportHTML(changedFiles)}
      </ul>
      <p dir="auto">New pages include:</p>
      <ul dir="auto">
      ${exportHTML(newFiles)}
      </ul>
    `
  }
  core.info('Changed and new files:', changedFiles, newFiles)

  return (
    result +
    (outRange
      ? '<p dir="auto">There are more changes not included in the list</p>'
      : '')
  )
}

const data = init()

core.info(data)
core.exportVariable('DIFFER_INFO', data)
