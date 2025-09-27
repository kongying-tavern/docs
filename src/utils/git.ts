import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import process from 'node:process'

export interface GitCommit {
  hash: string
  date: string
  author: string
  email: string
  message: string
}

export interface GitFileInfo {
  firstCommit: GitCommit
  lastModified: GitCommit
  commits: GitCommit[]
}

/**
 * 解析Git日志输出为结构化数据
 */
function parseGitLog(output: string): GitCommit[] {
  const commits: GitCommit[] = []
  const lines = output.trim().split('\n')

  for (const line of lines) {
    if (!line.trim())
      continue

    const parts = line.split('|||')
    if (parts.length >= 5) {
      commits.push({
        hash: parts[0].trim(),
        date: parts[1].trim(),
        author: parts[2].trim(),
        email: parts[3].trim(),
        message: parts[4].trim(),
      })
    }
  }

  return commits
}

/**
 * 获取文件的Git信息
 */
export async function getGitFileInfo(filePath: string): Promise<GitFileInfo | null> {
  try {
    // 检查文件是否存在
    if (!existsSync(filePath)) {
      return null
    }

    // 检查是否在Git仓库中
    try {
      execSync('git rev-parse --git-dir', {
        cwd: process.cwd(),
        stdio: 'pipe',
      })
    }
    catch {
      return null
    }

    // 获取文件的Git历史 - 使用相对路径
    const relativePath = filePath.replace(`${process.cwd()}/`, '').replace(/\\/g, '/')

    const gitLogCommand = [
      'git log',
      '--format="%H|||%ci|||%an|||%ae|||%s"',
      '--follow',
      `"${relativePath}"`,
    ].join(' ')

    const output = execSync(gitLogCommand, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: 'pipe',
    })

    const commits = parseGitLog(output)

    if (commits.length === 0) {
      return null
    }

    // 第一个是最新提交，最后一个是最早提交
    const lastModified = commits[0]
    const firstCommit = commits[commits.length - 1]

    return {
      firstCommit,
      lastModified,
      commits,
    }
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to get Git info for ${filePath}:`, error)
    return null
  }
}

/**
 * 获取当前Git仓库的根目录
 */
export function getGitRoot(): string | null {
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim()
    return gitRoot
  }
  catch {
    return null
  }
}

/**
 * 批量获取多个文件的Git信息
 */
export async function getGitFileInfoBatch(filePaths: string[]): Promise<Map<string, GitFileInfo>> {
  const results = new Map<string, GitFileInfo>()

  for (const filePath of filePaths) {
    const info = await getGitFileInfo(filePath)
    if (info) {
      results.set(filePath, info)
    }
  }

  return results
}
