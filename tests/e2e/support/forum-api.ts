import type { Page, Route } from '@playwright/test'
import type { INTER_KNOT } from '~/apis/interknot.site/api'
import { alice, comment, currentUser, issue } from '../fixtures/gitee'

const collaboratorsPath = /^\/api\/v5\/repos\/KYJGYSDT\/(?:Feedback|Blog)\/collaborators$/
const searchQualifiers = /\s+(?:repo|state|author):\S+/g
const issuePath = /^\/api\/v5\/repos\/KYJGYSDT\/Feedback\/issues\/([^/]+)$/
const commentsPath = /^\/api\/v5\/repos\/KYJGYSDT\/Feedback\/issues\/([^/]+)\/comments$/
const timelinePath = /^\/api\/v5\/repos\/KYJGYSDT\/issues\/[^/]+\/operate_logs$/
const followingPath = /^\/api\/v5\/users\/[^/]+\/following\/alice$/

export interface ApiRequest {
  method: string
  path: string
  query: URLSearchParams
  body: unknown
}
export interface ApiReply { status?: number, data?: unknown, headers?: Record<string, string> }
export type ApiHandler = (request: ApiRequest) => ApiReply | undefined | Promise<ApiReply | undefined>

export interface ForumScenario {
  topics?: GITEE.IssueInfo[]
  comments?: GITEE.Comment[]
  user?: GITEE.User
  following?: boolean
  /** Initial InterKnot reaction state, applied per reaction resource (the `url` query parameter). */
  reaction?: { likeCount?: number, dislikeCount?: number, state?: INTER_KNOT.ReactionState | null }
  // Only explicitly handled writes are allowed. Returning undefined delegates to the read fixtures.
  handle?: ApiHandler
}

interface ReactionSnapshot {
  likeCount: number
  dislikeCount: number
  state: INTER_KNOT.ReactionState | null
}

/**
 * Typed with the production response contract on purpose: `pnpm typecheck:forum:ui`
 * fails when the InterKnot envelope or the reaction payload drifts.
 */
function reactionPayload(reaction: ReactionSnapshot): INTER_KNOT.ReactionResponse {
  return {
    statusCode: 200,
    statusMessage: 'OK',
    data: {
      reaction: {
        id: 1,
        url: 'synthetic-reaction',
        likeCount: reaction.likeCount,
        dislikeCount: reaction.dislikeCount,
        clickCount: 0,
        createdAt: '2026-01-01T00:00:00+08:00',
        lastUpdatedAt: '2026-01-01T00:00:00+08:00',
      },
      state: reaction.state,
    },
  }
}

function applyReactionAction(reaction: ReactionSnapshot, action: string | null): void {
  if (reaction.state === 'like')
    reaction.likeCount = Math.max(reaction.likeCount - 1, 0)
  else if (reaction.state === 'dislike')
    reaction.dislikeCount = Math.max(reaction.dislikeCount - 1, 0)
  if (action === 'like')
    reaction.likeCount += 1
  else if (action === 'dislike')
    reaction.dislikeCount += 1
  reaction.state = action === 'like' || action === 'dislike' ? action : null
}

export async function installForumApi(page: Page, scenario: ForumScenario = {}) {
  const topics = scenario.topics ?? [issue()]
  const comments = scenario.comments ?? [comment()]
  let following = scenario.following ?? false
  const reactions = new Map<string, ReactionSnapshot>()
  const reactionFor = (resource: string): ReactionSnapshot => {
    let current = reactions.get(resource)
    if (!current) {
      current = { likeCount: scenario.reaction?.likeCount ?? 3, dislikeCount: scenario.reaction?.dislikeCount ?? 0, state: scenario.reaction?.state ?? null }
      reactions.set(resource, current)
    }
    return current
  }
  const requests: ApiRequest[] = []
  const unexpected: string[] = []
  const reply = async (route: Route, result: ApiReply) => route.fulfill({
    status: result.status ?? 200,
    ...(result.status === 204 ? {} : { contentType: 'application/json', body: JSON.stringify(result.data ?? {}) }),
    headers: result.headers,
  })

  await page.route(url => url.pathname.startsWith('/api/v5/')
    || (url.hostname === 'gitee.com' && url.pathname.startsWith('/oauth/'))
    || (url.hostname === 'hub.interknot.site' && url.pathname.startsWith('/api/')), async (route) => {
    const raw = route.request()
    const url = new URL(raw.url())
    const request: ApiRequest = { method: raw.method(), path: url.pathname, query: url.searchParams, body: raw.postData() }
    requests.push(request)
    const custom = await scenario.handle?.(request)
    if (custom) {
      await reply(route, custom)
      return
    }
    const { method, path, query } = request
    if (method === 'GET') {
      const repo = '/api/v5/repos/KYJGYSDT/Feedback/issues'
      if (path === '/api/v5/repos/KYJGYSDT/Feedback/labels') {
        await reply(route, paginated([{ name: 'TYP-FEAT', color: '2BBC6E' }, { name: 'TYP-BUG', color: 'DD4444' }, { name: 'CATA-LOGIN', color: 'AAAAAA' }], query))
        return
      }
      if (path === '/api/v5/gists' || path === '/api/v5/orgs/KYJGYSDT/members'
        || collaboratorsPath.test(path)) {
        await reply(route, paginated([], query))
        return
      }
      if (path === repo || path === '/api/v5/search/issues') {
        const labels = (query.get('labels') ?? query.get('label') ?? '').split(',').filter(Boolean)
        const state = query.get('state')
        const creator = query.get('creator') ?? query.get('author')
        const search = query.get('q')?.replace(searchQualifiers, '').trim().toLowerCase()
        const selected = topics.filter(topic => (!state || state === 'all' || topic.state === state)
          && (!creator || topic.user?.login === creator)
          && labels.every(label => topic.labels?.some(item => item?.name === label))
          && (!search || `${topic.title} ${topic.body}`.toLowerCase().includes(search)))
        selected.sort((a, b) => Date.parse((query.get('sort') ?? '').startsWith('updated') ? b.updated_at : b.created_at)
          - Date.parse((query.get('sort') ?? '').startsWith('updated') ? a.updated_at : a.created_at))
        await reply(route, paginated(selected, query))
        return
      }
      if (path === `${repo}/comments`) {
        await reply(route, paginated(comments, query))
        return
      }
      const detail = path.match(issuePath)
      if (detail) {
        const topic = topics.find(item => item.number === detail[1])
        await reply(route, topic ? { data: topic } : { status: 404, data: { message: 'Not Found' } })
        return
      }
      const topicComments = path.match(commentsPath)
      if (topicComments) {
        await reply(route, paginated(comments.filter(item => item.target?.issue?.number === topicComments[1]), query))
        return
      }
      if (timelinePath.test(path) && query.get('repo') === 'Feedback') {
        await reply(route, paginated([], query))
        return
      }
      if (path === '/api/v5/user' || path === `/api/v5/users/${alice.login}`) {
        await reply(route, { data: path === '/api/v5/user' ? scenario.user ?? currentUser : alice })
        return
      }
      if (followingPath.test(path)) {
        await reply(route, { status: following ? 204 : 404 })
        return
      }
      if (url.hostname === 'hub.interknot.site' && path === '/api/reactions') {
        await reply(route, { data: reactionPayload(reactionFor(query.get('url') ?? '')) })
        return
      }
      if (url.hostname === 'hub.interknot.site' && path === '/api/reactions/add') {
        const reaction = reactionFor(query.get('url') ?? '')
        applyReactionAction(reaction, query.get('action'))
        await reply(route, { data: reactionPayload(reaction) })
        return
      }
    }
    if (scenario.following !== undefined && path === '/api/v5/user/following/alice' && ['PUT', 'DELETE'].includes(method)) {
      following = method === 'PUT'
      await reply(route, { status: 204 })
      return
    }
    if ((scenario.user || scenario.following !== undefined) && method === 'POST'
      && url.hostname === 'hub.interknot.site' && path === '/api/sso/refresh-token') {
      await reply(route, { data: { state: true, message: '', data: {
        token: 'synthetic-sso-token',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400_000).toISOString(),
      } } })
      return
    }
    unexpected.push(`${method} ${path}`)
    await route.abort('blockedbyclient')
  })
  return { requests, unexpected }
}

function paginated<T>(items: T[], query: URLSearchParams): ApiReply {
  const page = Number(query.get('page') ?? 1)
  const size = Number(query.get('per_page') ?? 20)
  return { data: items.slice((page - 1) * size, page * size), headers: { Total_count: String(items.length), Total_page: String(Math.ceil(items.length / size)) } }
}
