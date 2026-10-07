import { readdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// 一轮 VitePress 分析包含客户端和 SSR 两个 session，仅保留最近一轮。
const root = fileURLToPath(new URL('../node_modules/.rolldown/', import.meta.url))
let entries
try {
  entries = await readdir(root, { withFileTypes: true })
}
catch (error) {
  if (error.code !== 'ENOENT')
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
