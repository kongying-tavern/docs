import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const available = ['forum', 'shared', 'theme', 'fonts']
const args = process.argv.slice(2)
const listOnly = args.includes('--list')
const requested = args.filter(arg => arg !== '--list')
const suites = requested.length ? [...new Set(requested)] : available
if (suites.some(suite => !available.includes(suite)))
  throw new Error(`Unknown suite. Choose: ${available.join(', ')}`)

const files = suites.flatMap((suite) => {
  const directory = join(root, 'tests', suite)
  const found = readdirSync(directory, { recursive: true })
    .filter(file => file.endsWith('.test.ts'))
    .map(file => join(directory, file))
  if (!found.length)
    throw new Error(`No tests discovered in tests/${suite}`)
  return found
}).sort()

if (listOnly) {
  process.stdout.write(`${files.map(file => relative(root, file).replaceAll('\\', '/')).join('\n')}\n`)
}
else {
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...files], { cwd: root, stdio: 'inherit' })
  if (result.error)
    throw result.error
  process.exitCode = result.status ?? 1
}
