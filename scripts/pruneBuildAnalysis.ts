/**
 * 清理一轮 VitePress 构建分析留下的旧 session，只保留最近一轮。
 *
 * 由 `node` 直接运行：只用可擦除语法，导入只走相对路径、内置模块与裸包。
 */
import type { Dirent } from 'node:fs'
import { readdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// 一轮 VitePress 分析包含客户端和 SSR 两个 session，仅保留最近一轮。
const root = fileURLToPath(new URL('../node_modules/.rolldown/', import.meta.url))

function isMissing(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
}

let entries: Dirent[]
try {
  entries = await readdir(root, { withFileTypes: true })
}
catch (error) {
  if (!isMissing(error))
    throw error
  entries = []
}

const sessions = entries.filter(entry => entry.isDirectory() && /^sid_\d+_\d+$/.test(entry.name))
  .sort((a, b) => Number(b.name.split('_').at(-1)) - Number(a.name.split('_').at(-1)))
for (const entry of sessions.slice(2)) {
  const target = resolve(root, entry.name)
  if (dirname(target) !== resolve(root))
    throw new Error(`Unexpected analysis directory: ${entry.name}`)
  await rm(target, { recursive: true, force: true, maxRetries: 3 })
  console.log(`Removed old build analysis: ${entry.name}`)
}
