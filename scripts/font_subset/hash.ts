import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { relative } from 'node:path'

export function calculateHash(
  projectRoot: string,
  namespace: string,
  files: string[],
  payload: unknown,
): string {
  const hash = createHash('sha256')
  hash.update(namespace)
  hash.update('\0')
  hash.update(JSON.stringify(payload))

  for (const file of files.toSorted()) {
    hash.update('\0')
    hash.update(relative(projectRoot, file).replaceAll('\\', '/'))
    hash.update('\0')
    hash.update(readFileSync(file))
  }
  return hash.digest('hex')
}
