/* eslint-disable test/no-import-node-test */
import type { LabelPageFetcher } from '../../src/forum/api/gitee/labels'
import assert from 'node:assert/strict'
import test from 'node:test'
import { getAllLabels } from '../../src/forum/api/gitee/labels'

function label(name: string): GITEE.IssueLabel {
  return {
    id: name.length,
    repository_id: 1,
    name,
    color: '336699',
    url: `https://gitee.com/labels/${name}`,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

test('loads every reported label page and deduplicates by name', async () => {
  const calls: number[] = []
  const fetchPage: LabelPageFetcher = async (page) => {
    calls.push(page)
    const pages = [
      [label('CATA-A'), label('CATA-SHARED')],
      [label('CATA-B'), label('CATA-SHARED')],
      [label('CATA-C')],
    ]
    return {
      data: pages[page - 1] ?? [],
      pagination: { total: 5, totalPage: 3 },
    }
  }

  const result = await getAllLabels(true, fetchPage)

  assert.deepEqual(calls, [1, 2, 3])
  assert.deepEqual(result.map(item => item.name), ['CATA-A', 'CATA-SHARED', 'CATA-B', 'CATA-C'])
})

test('falls back to reading until a short page when pagination headers are absent', async () => {
  const calls: number[] = []
  const fullPage = Array.from({ length: 100 }, (_, index) => label(`CATA-${index}`))
  const fetchPage: LabelPageFetcher = async (page) => {
    calls.push(page)
    return { data: page === 1 ? fullPage : [label('CATA-LAST')] }
  }

  const result = await getAllLabels(false, fetchPage)

  assert.deepEqual(calls, [1, 2])
  assert.equal(result.length, 101)
  assert.equal(result.at(-1)?.name, 'CATA-LAST')
})
