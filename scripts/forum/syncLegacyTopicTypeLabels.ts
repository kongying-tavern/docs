import type { LegacyTopicIssue } from './syncLegacyTopicTypeLabelsCore'
import process from 'node:process'
import { createInterface } from 'node:readline'
import {
  planTopicTypeLabels,
  verifiesTopicTypeLabels,
} from './syncLegacyTopicTypeLabelsCore'

const API_BASE = 'https://gitee.com/api/v5/'
const OWNER = 'KYJGYSDT'
const REPO = 'Feedback'
const PAGE_SIZE = 100
const NEXT_PAGE = /rel="?next"?/
const mode = process.argv[2]
const limit = process.argv[3] ? Number(process.argv[3]) : Number.POSITIVE_INFINITY

if ((mode !== '--dry-run' && mode !== '--apply') || !(limit > 0)) {
  console.error('Usage: pnpm exec tsx scripts/forum/syncLegacyTopicTypeLabels.ts --dry-run|--apply [limit] < token')
  process.exit(2)
}

const input = createInterface({ input: process.stdin, terminal: false })
const token = await new Promise<string>((resolve) => {
  input.once('line', (line) => {
    input.close()
    resolve(line.trim())
  })
})
if (!token) {
  console.error('Missing access token on stdin.')
  process.exit(2)
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function api<T>(method: 'GET' | 'PATCH', path: string, params: Record<string, string> = {}, payload?: Record<string, string>): Promise<{ data: T, link: string | null }> {
  const url = new URL(path, API_BASE)
  if (method === 'GET') {
    for (const [key, value] of Object.entries({ ...params, access_token: token }))
      url.searchParams.set(key, value)
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    let response: Response
    try {
      response = await fetch(url, {
        method,
        ...(payload
          ? {
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...payload, access_token: token }),
            }
          : {}),
      })
    }
    catch {
      // The GET URL contains the token, so never include the raw fetch error.
      throw new Error(`${method} ${path}: network failure`)
    }

    if (response.ok)
      return { data: await response.json() as T, link: response.headers.get('link') }

    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      await delay(1500 * (attempt + 1))
      continue
    }
    throw new Error(`${method} ${path}: HTTP ${response.status}`)
  }
  throw new Error(`${method} ${path}: retries exhausted`)
}

async function allIssues(): Promise<LegacyTopicIssue[]> {
  const issues: LegacyTopicIssue[] = []
  for (let page = 1; page <= 100; page++) {
    const { data, link } = await api<LegacyTopicIssue[]>('GET', `repos/${OWNER}/${REPO}/issues`, {
      state: 'all',
      page: String(page),
      per_page: String(PAGE_SIZE),
      sort: 'created',
      direction: 'desc',
    })
    if (!Array.isArray(data))
      throw new Error(`Issue list page ${page} was not an array.`)
    issues.push(...data)
    console.log(`Read page ${page}: ${data.length} issues`)
    if (!data.length || (!NEXT_PAGE.test(link ?? '') && data.length < PAGE_SIZE))
      return issues
    await delay(250)
  }
  throw new Error('Issue listing exceeded 100 pages; refusing incomplete migration.')
}

const issues = await allIssues()
const candidates = issues.flatMap((issue) => {
  const planned = planTopicTypeLabels(issue)
  return planned ? [{ issue, planned }] : []
})
const typeCounts = Object.fromEntries(['BUG', 'FEAT', 'ANN'].map(type => [type, candidates.filter(({ planned }) => planned.type === type).length]))
console.log(JSON.stringify({
  scanned: issues.length,
  candidates: candidates.length,
  typeCounts,
  sample: candidates.slice(0, 10).map(({ issue }) => issue.number),
}))

if (mode === '--apply') {
  for (const [index, { issue }] of candidates.slice(0, limit).entries()) {
    // Refresh immediately before writing so other users' new labels are preserved.
    const { data: before } = await api<LegacyTopicIssue>('GET', `repos/${OWNER}/${REPO}/issues/${issue.number}`)
    const planned = planTopicTypeLabels(before)
    if (!planned) {
      console.log(`Skipped ${index + 1}/${candidates.length}: ${issue.number} already correct`)
      continue
    }

    await api<LegacyTopicIssue>('PATCH', `repos/${OWNER}/issues/${issue.number}`, {}, {
      owner: OWNER,
      repo: REPO,
      labels: planned.labels.join(','),
    })

    let verified = false
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data: after } = await api<LegacyTopicIssue>('GET', `repos/${OWNER}/${REPO}/issues/${issue.number}`)
      if (verifiesTopicTypeLabels(before, after, planned)) {
        verified = true
        break
      }
      await delay(1000)
    }
    if (!verified)
      throw new Error(`Issue ${issue.number}: label or body verification failed; stopped at ${index + 1}/${candidates.length}.`)
    console.log(`Synced ${index + 1}/${candidates.length}: ${issue.number} -> TYP-${planned.type}`)
    await delay(300)
  }
}
