import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import matter from 'gray-matter'
import { shouldPublishPage } from '../../src/utils/pageVisibility.ts'

const GLOB_SPECIAL_CHARACTERS = /[()[\]{}*?!+@|]/g

export function getPageExclusions(pagesDir: string): string[] {
  const exclude = ['public/**']
  if (shouldPublishPage({ githubPagesOnly: true }))
    return exclude

  for (const entry of readdirSync(pagesDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md'))
      continue

    const file = join(entry.parentPath, entry.name)
    const route = relative(pagesDir, file).replaceAll('\\', '/')
    if (route.startsWith('public/') || route.split('/').some(part => part.startsWith('.')))
      continue

    // Use the same frontmatter parser as VitePress's renderer and content loaders.
    if (!shouldPublishPage(matter(readFileSync(file, 'utf8')).data))
      exclude.push(route.replace(GLOB_SPECIAL_CHARACTERS, '\\$&'))
  }
  return exclude
}
