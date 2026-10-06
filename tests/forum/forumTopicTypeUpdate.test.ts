import assert from 'node:assert/strict'
import test from 'node:test'
import { putTopic } from '../../src/forum/api/gitee/issues'

const issue = {
  number: 'I1',
  state: 'open',
  title: 'BUG:Existing title',
  body: '<!-- {"labels":["TYP-BUG"]} -->Body',
  html_url: 'https://gitee.com/KYJGYSDT/Feedback/issues/I1',
  comments: 0,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  labels: [{ name: 'TYP-BUG' }],
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

test('webhook failure keeps the confirmed topic and reports a partial update', async () => {
  const originalFetch = globalThis.fetch
  const requests: string[] = []
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    requests.push(request.method)
    if (request.method === 'PATCH')
      return jsonResponse(issue)
    if (request.method === 'POST')
      return new Response('Webhook unavailable', { status: 400 })
    if (request.method === 'GET')
      return jsonResponse({ ...issue, labels: [{ name: 'TYP-FEAT' }] })
    throw new Error(`Unexpected request: ${request.method}`)
  }
  try {
    const outcome = await putTopic('I1', { labels: 'TYP-FEAT' }, { confirmType: 'FEAT' })
    assert.equal(outcome.status, 'partial')
    assert.deepEqual(requests, ['PATCH', 'POST', 'GET'])
    assert.ok(outcome.status === 'partial')
    assert.equal(outcome.topic.type, 'FEAT')
    assert.ok(outcome.error instanceof Error)
  }
  finally {
    globalThis.fetch = originalFetch
  }
})

test('failed read-back keeps the PATCH result and reports a partial update', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    if (request.method === 'PATCH')
      return jsonResponse({ ...issue, title: 'FEAT:Updated title', labels: [{ name: 'TYP-FEAT' }] })
    if (request.method === 'GET')
      return new Response('Read-back unavailable', { status: 400 })
    throw new Error(`Unexpected request: ${request.method}`)
  }
  try {
    const outcome = await putTopic('I1', { labels: 'TYP-FEAT' }, { skipReformat: true })
    assert.ok(outcome.status === 'partial')
    assert.equal(outcome.topic.type, 'FEAT')
    assert.equal(outcome.topic.title, 'Updated title')
    assert.ok(outcome.error instanceof Error)
  }
  finally {
    globalThis.fetch = originalFetch
  }
})

test('type update confirms the persisted label even when the title keeps its legacy prefix', async () => {
  const originalFetch = globalThis.fetch
  const requests: Request[] = []
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    requests.push(request)
    if (request.method === 'PATCH')
      return jsonResponse(issue)
    if (request.method === 'GET')
      return jsonResponse({ ...issue, labels: [{ name: 'TYP-FEAT' }] })
    throw new Error(`Unexpected request: ${request.method}`)
  }
  try {
    const outcome = await putTopic('I1', {
      labels: 'TYP-FEAT',
      body: '<!-- {"labels":["TYP-FEAT"]} -->Body',
    }, { skipReformat: true, confirmType: 'FEAT' })
    assert.equal(outcome.status, 'success')
    if (outcome.status !== 'success')
      return
    assert.equal(outcome.topic.type, 'FEAT')
    assert.equal(outcome.topic.title, 'Existing title')
    assert.deepEqual(requests.map(request => request.method), ['PATCH', 'GET'])
    const patch = await requests[0]?.json() as Record<string, unknown>
    assert.equal(patch.title, undefined)
    assert.equal(patch.labels, 'TYP-FEAT')
    assert.match(String(patch.body), /"TYP-FEAT"/)
  }
  finally {
    globalThis.fetch = originalFetch
  }
})

test('type update rejects a 2xx response when the read-back label stayed unchanged', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    if (request.method === 'PATCH' || request.method === 'GET')
      return jsonResponse(issue)
    throw new Error(`Unexpected request: ${request.method}`)
  }
  try {
    const outcome = await putTopic('I1', { labels: 'TYP-FEAT' }, { skipReformat: true, confirmType: 'FEAT' })
    assert.equal(outcome.status, 'unknown')
  }
  finally {
    globalThis.fetch = originalFetch
  }
})

test('type update waits for webhook synchronization before confirming the label', async () => {
  const originalFetch = globalThis.fetch
  const requests: string[] = []
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    requests.push(`${request.method} ${new URL(request.url).pathname}`)
    if (request.method === 'PATCH')
      return jsonResponse(issue)
    if (request.method === 'POST' && request.url.includes('/webhook/'))
      return jsonResponse({})
    if (request.method === 'GET')
      return jsonResponse({ ...issue, labels: [{ name: 'TYP-FEAT' }] })
    throw new Error(`Unexpected request: ${request.method}`)
  }
  try {
    const outcome = await putTopic('I1', {
      labels: 'TYP-FEAT',
      body: '<!-- {"labels":["TYP-FEAT"]} -->Body',
    }, { confirmType: 'FEAT' })
    assert.equal(outcome.status, 'success')
    assert.deepEqual(requests.map(request => request.split(' ')[0]), ['PATCH', 'POST', 'GET'])
  }
  finally {
    globalThis.fetch = originalFetch
  }
})

test('other label updates reject a 2xx response when the read-back label stayed unchanged', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    if (request.method === 'PATCH' || request.method === 'GET')
      return jsonResponse(issue)
    throw new Error(`Unexpected request: ${request.method}`)
  }
  try {
    const outcome = await putTopic('I1', { labels: 'TYP-BUG,PINNED' }, { skipReformat: true })
    assert.equal(outcome.status, 'unknown')
  }
  finally {
    globalThis.fetch = originalFetch
  }
})

test('state updates reject a 2xx response when the read-back state stayed unchanged', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    if (request.method === 'PATCH' || request.method === 'GET')
      return jsonResponse(issue)
    throw new Error(`Unexpected request: ${request.method}`)
  }
  try {
    const outcome = await putTopic('I1', { state: 'closed' }, { skipReformat: true })
    assert.equal(outcome.status, 'unknown')
  }
  finally {
    globalThis.fetch = originalFetch
  }
})

test('confirmed label update retains the authoritative topic instead of the stale PATCH response', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    if (request.method === 'PATCH')
      return jsonResponse(issue)
    if (request.method === 'GET')
      return jsonResponse({ ...issue, labels: [{ name: 'TYP-BUG' }, { name: 'PINNED' }] })
    throw new Error(`Unexpected request: ${request.method}`)
  }
  try {
    const outcome = await putTopic('I1', { labels: 'TYP-BUG,PINNED' }, { skipReformat: true })
    assert.equal(outcome.status, 'success')
    if (outcome.status === 'success')
      assert.equal(outcome.topic.pinned, true)
  }
  finally {
    globalThis.fetch = originalFetch
  }
})
