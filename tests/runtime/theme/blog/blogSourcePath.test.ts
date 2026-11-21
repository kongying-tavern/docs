import assert from 'node:assert/strict'
import { join } from 'node:path'
import process from 'node:process'
import { test } from 'vitest'
import { buildBlogFilePath } from '../../../../src/utils/createBlogLoader.ts'
import { getGitFileInfo } from '../../../../src/utils/git.ts'

test('rewritten blog URLs still resolve to their source files and Git dates', async () => {
  assert.equal(buildBlogFilePath('/blog/posts/hotupdatelog-client'), join(process.cwd(), 'pages/zh/blog/posts/hotupdatelog-client.md'))
  assert.equal(buildBlogFilePath('/en/blog/posts/example'), join(process.cwd(), 'pages/en/blog/posts/example.md'))
  assert.equal(buildBlogFilePath('/ja/blog/posts/example'), join(process.cwd(), 'pages/ja/blog/posts/example.md'))
  assert.equal(buildBlogFilePath('/zh/blog/posts/example'), join(process.cwd(), 'pages/zh/blog/posts/example.md'))
  const history = await getGitFileInfo(buildBlogFilePath('/blog/posts/hotupdatelog-client'))
  assert.ok(history?.firstCommit.date, 'Rewritten Chinese URLs must retain the original publication date')
})
