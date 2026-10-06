import type { KyResponse } from 'ky'
import assert from 'node:assert/strict'
import test from 'node:test'
import { extractPaginationParams } from '../../src/forum/api/gitee/normalize'

const cases: Array<{ name: string, headers: Record<string, string>, expected: unknown }> = [
  { name: 'Gitee headers', headers: { Total_count: '21', Total_page: '2' }, expected: { total: 21, totalPage: 2 } },
  { name: 'alternate headers', headers: { 'X-Total-Count': '21', 'X-Total-Pages': '2' }, expected: { total: 21, totalPage: 2 } },
  { name: 'Link last page', headers: { Link: '<https://gitee.com/issues?page=2>; rel="next", <https://gitee.com/issues?page=4>; rel="last"' }, expected: { total: 0, totalPage: 4 } },
  { name: 'explicit page header takes precedence', headers: { Total_page: '2', Link: '<https://gitee.com/issues?page=4>; rel="last"' }, expected: { total: 0, totalPage: 2 } },
  { name: 'zero records', headers: { Total_count: '0', Total_page: '0' }, expected: { total: 0, totalPage: 0 } },
  { name: 'missing headers', headers: {}, expected: undefined },
  { name: 'non numeric and malformed Link', headers: { Total_count: 'NaN', Total_page: 'Infinity', Link: '<https://gitee.com/issues>; rel="last"' }, expected: undefined },
  { name: 'next link does not claim last page', headers: { Link: '<https://gitee.com/issues?page=2>; rel="next"' }, expected: undefined },
  { name: 'invalid preferred value falls through', headers: { 'Total_count': 'unknown', 'X-Total-Count': '3' }, expected: { total: 3, totalPage: 0 } },
]

for (const { name, headers, expected } of cases) {
  test(`pagination: ${name}`, () => {
    assert.deepEqual(extractPaginationParams(new Response('[]', { headers }) as KyResponse), expected)
  })
}
